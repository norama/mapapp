import json
import logging
import time
from collections import defaultdict

from httplib2 import Http
from google.appengine.api import memcache

from oauth2client.service_account import ServiceAccountCredentials
from apiclient.discovery import build


scopes = ['https://www.googleapis.com/auth/fusiontables']

service_keyfile = 'private/auth/keys/MapAppServiceKeys.json'

FTID = '1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2'

credentials = ServiceAccountCredentials.from_json_keyfile_name(service_keyfile, scopes)
http_auth = credentials.authorize(Http(memcache))
service = build('fusiontables', 'v2', http=http_auth)

def insert(values):
	logger = logging.getLogger()

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
	