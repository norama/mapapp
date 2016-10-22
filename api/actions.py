import json
import logging
import time
import urllib
from collections import defaultdict

from httplib2 import Http
from google.appengine.api import memcache

from oauth2client.service_account import ServiceAccountCredentials
from apiclient.discovery import build
from apiclient.http import HttpRequest
from fileupload import delete_with_thumbnail
from itemloader import read_external

from random import randint

scopes = ['https://www.googleapis.com/auth/fusiontables']

service_keyfile = 'private/auth/keys/MapAppServiceKeys.json'

FTID = u'1sShz8nYsrUu4NSG4hb-_vPTK4xCIYbCWNN-fAmJ2'

credentials = ServiceAccountCredentials.from_json_keyfile_name(service_keyfile, scopes)
http_auth = credentials.authorize(Http(memcache))
service = build('fusiontables', 'v2', http=http_auth)

logger = logging.getLogger()

epsilon = 0.001

def rowid(lat, lng):

	tolerance = epsilon / 100
	min_radius = 0.0
	max_radius = epsilon
	radius = epsilon / 2
	rows = None

	while radius < 10.0 and min_radius < max_radius:
		sqlRowid = u"SELECT rowid, Latitude, Longitude FROM {0} WHERE ST_INTERSECTS(Latitude, CIRCLE(LATLNG({1}, {2}), {3}))"\
		.format(FTID, lat, lng, radius)

		logger.info(sqlRowid)
		
		logger.info(str(min_radius) + ' ' +str(radius)+' '+str(max_radius))

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
				if radius < tolerance:
					return closest_row(lat, lng, rows)[0]
		else:
			if rows is not None:
				return closest_row(lat, lng, rows)[0]
			logger.info('no results, increasing radius')
			min_radius = radius
			if max_radius - radius < tolerance:
				max_radius = radius * 10
				radius = max_radius
			else:
				radius = (min_radius + max_radius) / 2

	raise ValueError('No item found around ({0}, {1})'.format(lat, lng))
	
def closest_row(lat, lng, rows):
	closest_row = None
	min_distance = None
	for row in rows:
		distance = _distance(float(lat), float(lng), float(row[1]), float(row[2]))
		if min_distance is None or distance < min_distance:
			closest_row = row
			min_distance = distance
	
	return closest_row

def _distance(lat1, lng1, lat2, lng2):
	Dlat = lat1 - lat2
	Dlng = lng1 - lng2
	return Dlat * Dlat + Dlng * Dlng
			

def insert(values, userId):

	allValues = _all_values(values)
	logger.info('INSERT values: ' + repr(allValues))

	now = _current_time()
	userId = userId.encode('utf-8')

	lat, lng = _unique_location(allValues['lat'], allValues['lng'])
	
	sqlInsert = u"INSERT INTO {0} (Title,URL,Type,Description,Details,Image,Latitude,Longitude,UserId,Timestamp,Helper,Marker) values('{1}', '{2}', '{3}', '{4}', '{5}', '{6}', '{7}', '{8}', '{9}', '{10}', 0, '{11}')"\
	.format(FTID, allValues['title'], allValues['url'], allValues['type'], allValues['description'],  allValues['details'],  allValues['image'], lat, lng, userId, now, allValues['marker'])

	logger.info('SQL INSERT: ' + sqlInsert)
	
	# PROBLEM: even if POST, appends sql to query string -> URL too long error
	# res = service.query().sql(sql=sqlInsert).execute()
	
	res = execute(sqlInsert)

	if 'rows' not in res:
		raise ValueError('Error in insert: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	rowid = res['rows'][0][0]

	item = _get_item(rowid)
	return json.dumps(item)
	
def insert_external(url, _type, userId):
	values = read_external(url, _type)
	
	return insert(values, userId)
	
def update(rowid, values, userId):

	_check_same_user(rowid, userId)

	allValues = _all_values(values)
	now = _current_time()
	userId = userId.encode('utf-8')

	sqlUpdate = u"UPDATE {0} SET Title='{1}', URL='{2}', Description='{3}', Details='{4}', Image='{5}', Timestamp='{6}' WHERE rowid = '{7}'"\
	.format(FTID, allValues['title'], allValues['url'], allValues['description'], allValues['details'],  allValues['image'], now, rowid)

	logger.info(sqlUpdate)
	
	# PROBLEM: even if POST, appends sql to query string -> URL too long error
	# res = service.query().sql(sql=sqlUpdate).execute()
	
	res = execute(sqlUpdate)

	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in update: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	rowCount = int(res['rows'][0][0])
	if rowCount != 1:
		raise ValueError('Error in update, number of modified rows should be 1 instead of: {0}'.format(rowCount))

	item = _get_item(rowid)
	return json.dumps(item)

def execute(sql):
	header, res = http_auth.request('https://www.googleapis.com/fusiontables/v2/query?alt=json',\
             method='POST',\
             body=urllib.urlencode({\
               'sql': sql.encode('utf-8') \
             }), \
             headers={'Content-Type': 'application/x-www-form-urlencoded'})
	
	return json.loads(res)

def delete(rowid, userId):

	_check_same_user(rowid, userId)
	
	# problematic: 
	# 1. same origin problem
	# 2. external item: external image cannot and should not be deleted
	# _delete_image(rowid)

	sqlDelete = u"DELETE FROM {0} WHERE rowid = '{1}'"\
	.format(FTID, rowid)

	logger.info(sqlDelete)

	res = service.query().sql(sql=sqlDelete).execute()
	logger.info(res)

	return json.dumps(res)

def _all_values(values):
	allValues = defaultdict(lambda: u'')
	for key in values:
		allValues[key] = values[key].replace("'","\\'")
	return allValues

def _current_time():
	return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()).encode('utf-8')

def _delete_image(rowid):
	sqlSelect = u"SELECT Image FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()

	if 'rows' not in res:
		raise ValueError('No item with rowid: {0}'.format(rowid))

	image = res['rows'][0][0]
	if image:
		delete_with_thumbnail(image)

def _unique_location(lat, lng):
	lat = _round_float(lat)
	lng = _round_float(lng)
	logger.info('_unique_location: checking ({0}, {1})'.format(lat, lng))
	sqlSelect = u"SELECT Title FROM {0} WHERE ST_INTERSECTS(Latitude, CIRCLE(LATLNG({1}, {2}), {3}))"\
	.format(FTID, lat, lng, epsilon)
	res = service.query().sql(sql=sqlSelect).execute()
	
	logger.info(sqlSelect)
	logger.info(json.dumps(res, indent=4))
	
	if 'rows' not in res:
		logger.info('===> _unique_location: returning ({0}, {1})'.format(lat, lng))
		return (lat, lng)
	
	dlat = randint(-2, 2)
	dlng = randint(-2, 2)
	lat = float(lat) + 2*dlat*epsilon
	lng = float(lng) + 2*dlng*epsilon
	
	return _unique_location(lat, lng)

def _round_float(x):
	return float(int(float(x) * 10000000)) / 10000000
		
def _check_same_user(rowid, userId):
	sqlSelect = u"SELECT UserId FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()

	if 'rows' not in res:
		raise ValueError('No item with rowid: {0}'.format(rowid))

	if res['rows'][0][0] != userId:
		raise ValueError('User does not have permission to delete item with rowid: {0}'.format(rowid))


def _get_item(rowid):

	sqlSelect = u"SELECT Title, URL, Type, Description, Details, Image, Latitude, Longitude, UserId, Marker FROM {0} WHERE rowid = {1}"\
	.format(FTID, rowid)
	res = service.query().sql(sql=sqlSelect).execute()
	logger.info(res)

	if 'rows' not in res:
		raise ValueError('Error in select: ' + json.dumps(res, sort_keys=True, indent=4, separators=(',', ': ')))

	row = res['rows'][0]

	result = {
		'rowid': rowid,
		'title': row[0],
		'url': row[1],
		'type': row[2],
		'description': row[3],
		'details': row[4],
		'image': row[5],
		'lat':  row[6],
		'lng':  row[7],
		'userId': row[8],
		'marker': row[9]
	}

	return result