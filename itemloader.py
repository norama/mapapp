from bs4 import BeautifulSoup

import urllib
import urllib2
import httplib

import json
import re

import sys

import logging

logger = logging.getLogger()

def read_external(url):
	
	config_string = read_file('config/external/drevo-les.json')
	# logger.info(json.dumps(config, indent=4))
	config = json.loads(config_string)
	
	html = read_url(url)
	# logger.info(html)
	soup = BeautifulSoup(html, 'html.parser')
	
	home = ''
	if 'home' in config:
		home = config['home']
		
	image = _select('image', config, soup)
	if image:
		image = home + image
	
	values = dict()
	values['url'] = url
	values['title'] = _select('title', config, soup) 
	values['image'] = image
	values['description'] = _select('description', config, soup) 
	values['details'] = _select('details', config, soup) 
	values['config'] = config_string.replace('\\','\\\\')
	
	latlng = _select('latlng', config, soup) 
	if (len(latlng) != 2):
		raise ValueError('Could not add item: latlng missing.')
	lat = latlng[0]
	lng = latlng[1]
	
	logger.info('lat: '+lat+' lng: '+lng)
	values['lat'] = lat
	values['lng'] = lng
	
	return values

def read_file(path):
	try:
		f = open(path, 'r')
	except IOError:
		raise ValueError('IOError while opening file: ' + path)
	s = f.read()
	f.close()
	return s
	

def read_url(url):
	try:
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


def _select(key, config, soup):
	if key not in config:
		return u''
	
	return _find(selector=config[key], soup=soup)

def _find(selector, soup):
	tag = soup
	if not isinstance(selector, list):
		selector = [selector]
	for s in selector:
		if isinstance(s, basestring):
			tag_list = tag.select(s)
			if tag_list:
				tag = tag_list[0]
			else:
				tag = None
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
		else:
			raise ValueError('Config error: selector type' +type(s) + ' is not supported, use string or dict')
		if tag is None:
			return u''
	return _content(tag)

# <div id="map"><script>ddd</script><script>latlng(15.6, 14.2)</script></div>
#
# string = soup.find('div', attrs={'id': 'map'}).find('script', text=re.compile('^latlng\((.*?),(.*?)\)')).string
# m = re.search('^latlng\((.*?),(.*?)\)', string)
# m.group(1), m.group(2)
# m.groups() -> if empty, take m.group(0)
def _extract_text(base_tag, tag_name, attrs={}, text_pattern=None):
	# logger.info('------------------ base_tag: '+str(base_tag)+' tag_name: '+tag_name)
	tag = base_tag.find(tag_name, attrs=attrs, text=re.compile(text_pattern))
	if tag is None:
		return u''
	# logger.info('------------------ pattern: '+pattern+' tag.string: '+tag.string)
	return _extract_string(text_pattern, tag.string)

def _extract_attr(base_tag, tag_name, attrs={}, attr_pattern=None):
	tag = base_tag.find(tag_name, attrs=attrs)
	if tag is None:
		return u''
	entry = attr_pattern.items()[0]
	attr = entry[0]
	pattern = entry[1]
	if attr in tag.attrs:
		return _extract_string(pattern, tag.attrs[attr])
	else:
		return u''

def _extract_string(pattern, string):
	if pattern is None:
		return string
	match = re.search(pattern, string)
	groups = match.groups()
	groups = tuple(g.strip() for g in groups)
	if len(groups) == 0:
		return match(0)
	elif len(groups) == 1:
		return groups[0]
	else:
		return groups

# http://stackoverflow.com/questions/9044088/beautifulsoup-strip-specified-attributes-but-preserve-the-tag-and-its-contents
def _content(tag):
	if tag is None:
		return u''
	REMOVE_ATTRIBUTES = ['id']
	soup = BeautifulSoup(tag.decode(), 'html.parser')
	for tag in soup.recursiveChildGenerator():
		if hasattr(tag, 'attrs'):
			tag.attrs = {key:value for key,value in tag.attrs.iteritems() if key not in REMOVE_ATTRIBUTES}
	return unicode(soup).strip()
		
def _string(s):
	if s is None:
		return ''
	return unicode(s.string)

# Usage: 
# python .\itemloader.py 'title' .\test\externalitem.json .\test\externalitem.html
if __name__ == '__main__':
	key = sys.argv[1]
	config_string = read_file(sys.argv[2])
	config = json.loads(config_string)
	soup = BeautifulSoup(open(sys.argv[3]), 'html.parser')
	value = _select(key, config, soup)
	print 'RESULT: ', value