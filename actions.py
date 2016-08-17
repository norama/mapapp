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

FTID = u'1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2'

credentials = ServiceAccountCredentials.from_json_keyfile_name(service_keyfile, scopes)
http_auth = credentials.authorize(Http(memcache))
service = build('fusiontables', 'v2', http=http_auth)

logger = logging.getLogger()


def insert(values, userId):

	allValues = defaultdict(lambda: u'')
	for key in values:
		allValues[key] = values[key]
	now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()).encode('utf-8')
	userId = userId.encode('utf-8')

	sqlInsert = u"INSERT INTO {0} (Title,Description,Latitude,Longitude,UserId,Timestamp) values('{1}', '{2}', '{3}', '{4}', '{5}', '{6}')"\
	.format(FTID, allValues['title'], allValues['description'], allValues['lat'], allValues['lng'], userId, now)

	logger.info(sqlInsert)

	res = service.query().sql(sql=sqlInsert).execute()
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in insert: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))


	rowid = res['rows'][0][0]

	sqlSelect = u"SELECT Title, Description, Latitude, Longitude, UserId FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()

	logger.info('----------- RES --------------')
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in select: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	row = res['rows'][0]

	result = {
		'rowid': rowid,
		'Title': { 'columnName': 'Title', 'value': row[0] },
		'Description':  { 'columnName': 'Description', 'value': row[1] },
		'lat': row[2],
		'lng': row[3],
		'UserId': { 'columnName': 'UserId', 'value': row[4] },
	}
	return json.dumps(result) # '{"key" : "value"}'
	

def delete(rowid):

	sqlDelete = u"DELETE FROM {0} WHERE rowid = '{1}'"\
	.format(FTID, rowid)

	logger.info(sqlDelete)

	res = service.query().sql(sql=sqlDelete).execute()
	logger.info(res)

	return json.dumps(res)