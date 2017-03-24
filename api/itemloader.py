from bs4 import BeautifulSoup

from filereader import read_file, read_json

import urllib
import urllib2
import httplib

import json
import re
import geocoder

import sys
import time

import requests

import logging

logger = logging.getLogger()

MARKERS = read_json('config/external/markers.json')
GEOCODING_KEYS = read_json('private/auth/keys/GeocodingKeys.json')

SELECTORS = read_json('config/external/selectors.json')

def _config(_type):
	selector = SELECTORS.get(_type, _type)
	return read_json('config/external/selectors/'+selector+'.json')

def _home(config):
	home = ''
	if 'home' in config:
		home = config['home']
	return home

def _abs_url(home, url):
	if url.startswith('/'):
		return home + url
	else:
		return url

def _soup(url):
	html = read_url(url)
	return BeautifulSoup(html, 'html.parser')

def read_external_item_urls(url, _type):
	config = _config(_type)
	soup = _soup(url)
	home = _home(config)
	selector = config['item']
	a_tags = soup.select(selector)
	return [_abs_url(home, a['href']) for a in a_tags]
	
def read_external_item(url, _type):		
	config = _config(_type)	
	soup = _soup(url)
	home = _home(config)
		
	image = _select('image', config, soup, home)
	if image:
		image = _abs_url(home, image)
	
	values = dict()
	values['type'] = _type
	values['url'] = url
	values['title'] = _select('title', config, soup, home) 
	values['image'] = image
	values['description'] = _select('description', config, soup, home) 
	values['details'] = _select('details', config, soup, home) 
	values['marker'] = MARKERS[_type]
	
	lat, lng = _latlng(config, soup, home)
	lat = str(lat)
	lng = str(lng)
	
	logger.info('lat: '+lat+' lng: '+lng)
	values['lat'] = lat
	values['lng'] = lng
	
	return values

def _latlng(config, soup, home):
	latlng = _select('latlng', config, soup, home) 	
	if isinstance(latlng, tuple) and len(latlng) == 2:
		return latlng
	
	address = _select('address', config, soup, home) 
	if not address:
		address = _select('nomap-address', config, soup, home)
		if not address:
			address = _select('nomap-address-2', config, soup, home)
	if address:
		latlng = geocode_opencage(address)
	else:
		raise ValueError('Could not add item: invalid location data.')
	return latlng

def geocode_opencage(address):
	time.sleep(1)
	logger.info(u'geocode_opencage address: '+address)
	g = geocoder.opencage(address, key=GEOCODING_KEYS['OpenCage'])
	res = g.json
	
	logger.info('geocode: '+json.dumps(res, indent=4))
	if res['status'] == 'OK' and 'lat' in res and 'lng' in res:
		return [res['lat'], res['lng']]
	else:
		raise ValueError('Could not add item: ' + res['status'])

def geocode_google(address):
	logger.info(u'geocode_google address: '+address)
	g = geocoder.google(address)
	res = g.json
	
	logger.info('geocode: '+json.dumps(res))
	if res['status'] == 'OK' and 'lat' in res and 'lng' in res:
		return [res['lat'], res['lng']]
	else:
		raise ValueError('Could not add item: ' + res['status'])
	
def geocode1(address):
	url = 'https://maps.googleapis.com/maps/api/geocode/json'
	params = {'sensor': 'false', 'address': address}
	r = requests.get(url, params=params)
	logger.info(json.dumps(r.json()))
	results = r.json()['results']
	location = results[0]['geometry']['location']
	return [location['lat'], location['lng']]
	
	logger.info('geocode: '+json.dumps(res))
	if res['status'] == 'OK' and 'lat' in res and 'lng' in res:
		return [res['lat'], res['lng']]
	else:
		return None

def read_url(url):
	try:
		logger.info('reading URL: ' + url)
		response = urllib2.urlopen(url)
		return response.read()
	except urllib2.HTTPError, e:
		raise ValueError('HTTPError while opening url: ' + url + ' code: ' + str(e.code))
	except urllib2.URLError, e:
		raise ValueError('URLError while opening url: ' + url + ' read_configason: ' + str(e.reason))
	except httplib.HTTPException, e:
		raise ValueError('HTTPException while opening url: ' + url)
	except Exception, e:
		raise ValueError('Unexpected error while reading url: ' + url + ' error: '+ sys.exc_info()[0])


def _select(key, config, soup, home):
	if key not in config:
		return u''
	
	logger.info('_select: '+key+' : '+json.dumps(config[key]))
	value = _find(selector=config[key], soup=soup, home=home)
	logger.info(key+' = '+unicode(value))
	return value

def _find(selector, soup, home):
	tag = soup
	if not isinstance(selector, list):
		selector = [selector]
	for s in selector:
		if isinstance(s, basestring):
			tag = _select_tag(tag, s)
		elif isinstance(s, dict):
			entry = s.items()[0]
			tag_name = entry[0]
			x = entry[1]
			if isinstance(x, basestring):
				return _extract_text(tag, tag_name, text_pattern=x)
			elif isinstance(x, list):
				if len(x) != 2 or not isinstance(x[0], dict):
					raise ValueError('Config error: list should be [attrs, pattern] of type [dict, string] or [dict, dict]')
					
				if isinstance(x[1], basestring):				
					return _extract_text(tag, tag_name, attrs=x[0], text_pattern=x[1])
				elif isinstance(x[1], dict):
					return _extract_attr(tag, tag_name, attrs=x[0], attr_pattern=x[1])
				else:
					raise ValueError('Config error: pattern should be string or dict')
					
			elif isinstance(x, dict):
				tag = tag.find(tag_name, attrs=x)
			else:
				raise ValueError('Config error: selector type' +type(x) + ' is not supported, use list, string or dict')
		elif isinstance(s, list):
			tag_selector = s[0]
			text_selector = s[1]
			return _extract_child_text(tag, tag_selector, text_selector)
		else:
			raise ValueError('Config error: selector type' +type(s) + ' is not supported, use string or dict')
		if tag is None:
			return u''
	return _content(tag, home)

def _find_tag(tag, tag_selector):
	if isinstance(tag_selector, basestring):
		return _select_tag(tag, tag_selector)
	elif isinstance(tag_selector, dict):
		entry = tag_selector.items()[0]
		tag_name = entry[0]
		x = entry[1]
		return tag.find(tag_name, attrs=x)
	else:
		return None

def _select_tag(tag, s):
	tag_list = tag.select(s)
	if tag_list:
		return tag_list[0]
	else:
		return None
	
def _extract_child_text(tag, tag_selector, text_selector):
	tag = _find_tag(tag, tag_selector)
	if tag is None:
		return u''
	texts = tag.find_all(text=True)
	if text_selector.isdigit():
		return _string(texts[int(text_selector)])
	elif text_selector == 'LAST':
		return _string(texts[len(texts) - 1])
	else:
		return _extract_by_labels(texts, text_selector)
	
def _extract_by_labels(texts_with_labels, labels):
	texts_with_labels = [x.strip() for x in texts_with_labels if x.strip()]
	labels = labels.split()
	label2text = _label2text(texts_with_labels, labels)
	# logger.info(str(label2text));
	texts = []
	for label in labels:
		texts.append(label2text.get(label, ''))
	return ' '.join(texts)
	
def _label2text(texts_with_labels, labels):
	# logger.info('labels: '+str(labels))
	label2text = {}
	length = len(texts_with_labels)
	index = 1
	while index < length:
		label = texts_with_labels[index - 1]
		# logger.info('label: '+label)
		if label in labels:
			label2text[label] = texts_with_labels[index]
		index += 1
	return label2text

# <div id="map"><script>ddd</script><script>latlng(15.6, 14.2)</script></div>
#
# string = soup.find('div', attrs={'id': 'map'}).find('script', text=re.compile('^latlng\((.*?),(.*?)\)')).string
# m = re.search('^latlng\((.*?),(.*?)\)', string)
# m.group(1), m.group(2)
# m.groups() -> if empty, take m.group(0)
def _extract_text(base_tag, tag_name, attrs={}, text_pattern=None):
	tag = base_tag.find(tag_name, attrs=attrs, text=re.compile(text_pattern))
	if tag is None:
		return u''
	return _extract_string(text_pattern, tag.string)

def _extract_attr(base_tag, tag_name, attrs={}, attr_pattern=None):
	entry = attr_pattern.items()[0]
	attr = entry[0]
	pattern = entry[1]
	attrs[attr] = re.compile(pattern)
	
	tag = base_tag.find(tag_name, attrs=attrs)
	if tag is None:
		return u''
	
	return _extract_string(pattern, tag.attrs[attr])

def _extract_string(pattern, string):
	# logger.info('_extract_string: pattern='+pattern+' string='+string)
	if pattern is None:
		return string
	match = re.search(unicode(pattern), unicode(string))
	if match is None:
		return u''
	groups = match.groups()
	groups = tuple(g.strip() for g in groups)
	if len(groups) == 0:
		return match(0)
	elif len(groups) == 1:
		return groups[0]
	else:
		return groups

# http://stackoverflow.com/questions/9044088/beautifulsoup-strip-specified-attributes-but-preserve-the-tag-and-its-contents
def _content(tag, home):
	if tag is None:
		return u''
	REMOVE_ATTRIBUTES = ['id']
	soup = BeautifulSoup(tag.decode(), 'html.parser')
	for tag in soup.descendants:
		if hasattr(tag, 'attrs'):
			tag.attrs = {key: value for key,value in tag.attrs.iteritems() if key not in REMOVE_ATTRIBUTES}
	for a in soup.find_all('a'):
		if a.has_attr('href'):
			a['href'] = _abs_url(home, a['href'])
			a['target'] = '_blank'
	return unicode(soup).strip()
		
def _string(s):
	if s is None:
		return ''
	return unicode(s.string).strip()

# Usage: 
# python .\api\itemloader.py 'title' .\test\externalitem.json .\test\externalitem.html
if __name__ == '__main__':
	key = sys.argv[1]
	config = read_json(sys.argv[2])
	soup = BeautifulSoup(open(sys.argv[3]), 'html.parser')
	value = _select(key, config, soup, '')
	print 'RESULT: ', value