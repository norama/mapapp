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


def rowid(lat, lng):

	min_radius = 0
	max_radius = 10
	radius = 10

	while radius < 100000 and min_radius < max_radius:
		sqlRowid = u"SELECT rowid FROM {0} WHERE ST_INTERSECTS(Latitude, CIRCLE(LATLNG({1}, {2}), {3}))"\
		.format(FTID, lat, lng, radius)

		logger.info(sqlRowid)

		res = service.query().sql(sql=sqlRowid).execute()
		logger.info(res)

		if 'rows' in res:
			rows = res['rows']
			if len(rows) == 1:
				return rows[0][0]
			else:
				logger.info('too many results ({0}), trying radius in between'.format(len(rows)))
				max_radius = radius
				radius = int((min_radius + max_radius) / 2)
		else:
			logger.info('no results, increasing radius')
			min_radius = radius
			if max_radius == radius:
				max_radius = radius * 10
				radius = max_radius
			else:
				radius = int((min_radius + max_radius) / 2)

	raise ValueError('No item found around ({0}, {1})'.format(lat, lng))

def insert(values, userId):

	allValues = _all_values(values)
	now = _current_time()
	userId = userId.encode('utf-8')

	sqlInsert = u"INSERT INTO {0} (Title,Description,Latitude,Longitude,UserId,Timestamp) values('{1}', '{2}', '{3}', '{4}', '{5}', '{6}')"\
	.format(FTID, allValues['title'], allValues['description'], allValues['lat'], allValues['lng'], userId, now)

	logger.info(sqlInsert)

	res = service.query().sql(sql=sqlInsert).execute()
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in insert: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	rowid = res['rows'][0][0]

	item = _get_item(rowid)
	return json.dumps(item)
	
def update(rowid, values, userId):

	_check_same_user(rowid, userId)

	allValues = _all_values(values)
	now = _current_time()
	userId = userId.encode('utf-8')

	sqlUpdate = u"UPDATE {0} SET Title='{1}', Description='{2}', Timestamp='{3}' WHERE rowid = '{4}'"\
	.format(FTID, allValues['title'], allValues['description'], now, rowid)

	logger.info(sqlUpdate)

	res = service.query().sql(sql=sqlUpdate).execute()
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in update: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))


	rowCount = int(res['rows'][0][0])
	if rowCount != 1:
		raise ValueError('Error in update, number of modified rows should be 1 instead of: {0}'.format(rowCount))

	item = _get_item(rowid)
	return json.dumps(item)

def delete(rowid, userId):

	_check_same_user(rowid, userId)

	sqlDelete = u"DELETE FROM {0} WHERE rowid = '{1}'"\
	.format(FTID, rowid)

	logger.info(sqlDelete)

	res = service.query().sql(sql=sqlDelete).execute()
	logger.info(res)

	return json.dumps(res)

def _all_values(values):
	allValues = defaultdict(lambda: u'')
	for key in values:
		allValues[key] = values[key]
	return allValues

def _current_time():
	return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()).encode('utf-8')

def _check_same_user(rowid, userId):
	sqlSelect = u"SELECT UserId FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()

	if 'rows' not in res:
		raise ValueError('No item with rowid: {0}'.format(rowid))

	if res['rows'][0][0] != userId:
		raise ValueError('User does not have permission to delete item with rowid: {0}'.format(rowid))


def _get_item(rowid):

	sqlSelect = u"SELECT Title, Description, Latitude, Longitude, UserId FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in select: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	row = res['rows'][0]

	result = {
		'rowid': rowid,
		'Title': { 'columnName': 'Title', 'value': row[0] },
		'Description':  { 'columnName': 'Description', 'value': row[1] },
		'lat':  row[2],
		'lng':  row[3],
		'UserId': { 'columnName': 'UserId', 'value': row[4] },
	}

	return result