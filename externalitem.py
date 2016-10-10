from bs4 import BeautifulSoup

import urllib
import urllib2
import httplib

import json

import sys

import logging

logger = logging.getLogger()

def read_external(url):
	
	config = read_config('config/external/drevo-les.json')
	# logger.info(json.dumps(config, indent=4))
	
	html = read_url(url)
	# logger.info(html)
	soup = BeautifulSoup(html, 'html.parser')
	
	values = dict()
	values['url'] = url
	values['title'] = _select('title', config, soup) 
	values['description'] = _select('description', config, soup) 
	values['details'] = _select('details', config, soup) 
	values['config'] = json.dumps(config)
	values['lat'] = '49.2107918'
	values['lng'] = '14.0124039'
	
	return values

def read_config(path):
	try:
		f = open(path, 'r')
	except IOError:
		raise ValueError('IOError while opening config file: ' + path)
	s = f.read()
	f.close()
	return json.loads(s)
	

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
	selector = config[key]
	if selector is None:
		return u''
	
	value = _content(_find(selector, soup))

	# URL encoding problem with this
#	if 'css' in config:
#		css = config['css']
#		if key in css:
#			value = u"<section>{0} {1}</section>".format(_style(css[key]), value)

	return value

def _style(url):
	return u"<style scoped>@import url({0});</style>".format(unicode(url))

def _find(selector, soup):
	tag = soup
	if not isinstance(selector, list):
		selector = [selector]
	for s in selector:
		print s, type(s)
		if isinstance(s, basestring):
			tag = tag.find(s)
		elif isinstance(s, dict):
			elem, attributes = s.items()[0]
			tag = tag.find(elem, attrs=attributes)
		else:
			raise ValueError('Config error: ' + s + ' should be string or list')
		print s, tag
		if tag is None:
			return None
	return tag
	
def _content(tag):
	if tag is None:
		return u''
	return u''.join(unicode(x) for x in tag.contents)
		
def _string(s):
	if s is None:
		return ''
	return unicode(s.string)

# Usage: 
# python .\externalitem.py 'title' .\test\externalitem.json .\test\externalitem.html
if __name__ == '__main__':
	key = sys.argv[1]
	config = read_config(sys.argv[2])
	soup = BeautifulSoup(open(sys.argv[3]), 'html.parser')
	value = _select(key, config, soup)
	print 'RESULT: ', value