import json
import logging
import time
from collections import defaultdict

from httplib2 import Http
from google.appengine.api import memcache
from google.appengine.api import users
from oauth2client.contrib.appengine import OAuth2Decorator
from oauth2client.service_account import ServiceAccountCredentials
from apiclient.discovery import build

from oauth2client.contrib.appengine import OAuth2DecoratorFromClientSecrets

scopes = ['https://www.googleapis.com/auth/fusiontables']

service_keyfile = 'private/auth/keys/MapAppServiceKeys.json'

FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2'

credentials = ServiceAccountCredentials.from_json_keyfile_name(service_keyfile, scopes)
http_auth = credentials.authorize(Http(memcache))
service = build('fusiontables', 'v2', http=http_auth)

client_scopes = ['profile', 'email']

client_keyfile = 'private/auth/keys/MapAppClientKeys.json'

client_decorator = OAuth2DecoratorFromClientSecrets(client_keyfile, client_scopes)

client_service = build('people', 'v1')

# @client_decorator.oauth_required
def insert(values):
	logger = logging.getLogger()

	# http = client_decorator.http()
	# userinfo = client_service.get('https://www.googleapis.com/userinfo/v2/me').execute(http)
	# logger.info(userinfo)

	allValues = defaultdict(lambda: '')
	for key in values:
		allValues[key] = values[key]
	now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

	sqlInsert = "INSERT INTO {0} (Title,Description,Latitude,Longitude,Timestamp) values('{1}', '{2}', '{3}', '{4}', '{5}')"\
	.format(FTID, allValues['title'], allValues['description'], allValues['lat'], allValues['lng'], now)
	logger.info(sqlInsert)

	res = service.query().sql(sql=sqlInsert).execute()
	logger.info(res)
	return json.dumps(res) # '{"key" : "value"}'
	