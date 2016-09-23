# -*- coding: utf-8 -*-
#
# jQuery File Upload Plugin GAE Python Example
# https://github.com/blueimp/jQuery-File-Upload
#
# Copyright 2011, Sebastian Tschan
# https://blueimp.net
#
# Licensed under the MIT license:
# http://www.opensource.org/licenses/MIT
#

from google.appengine.api import images
from google.appengine.api import app_identity
from gcloud import storage

import json
import os
import re
import uuid
import urllib
import webapp2
import logging

logger = logging.getLogger()

DEBUG = os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')

MIN_FILE_SIZE = 1  # bytes
# Max file size is memcache limit (1MB) minus key size minus overhead:
MAX_FILE_SIZE = 999000  # bytes
IMAGE_TYPES = re.compile('image/(gif|p?jpeg|(x-)?png)')
ACCEPT_FILE_TYPES = IMAGE_TYPES
THUMB_MAX_WIDTH = 80
THUMB_MAX_HEIGHT = 80
THUMB_SUFFIX = '.'+str(THUMB_MAX_WIDTH)+'x'+str(THUMB_MAX_HEIGHT)+'.png'
EXPIRATION_TIME = 300  # seconds
# If set to None, only allow redirects to the referer protocol+host.
# Set to a regexp for custom pattern matching against the redirect value:
REDIRECT_ALLOW_TARGET = None

CLOUD_STORAGE_BUCKET = os.environ['CLOUD_STORAGE_BUCKET']

def json_stringify(obj):
    return json.dumps(obj, separators=(',', ':'))

def thumbnail(url):
	return url + THUMB_SUFFIX

def imageUrl(info):
	return urllib.quote(info['type'].encode('utf-8'), '') +\
		'/' + str(uuid.uuid4()) +\
		'/' + urllib.quote(info['name'].encode('utf-8'), '')

def delete_with_thumbnail(url):
	delete(url)
	delete(thumbnail(url))

def delete(url):
	bucket = storage.Client().get_bucket(CLOUD_STORAGE_BUCKET)
	i = url.find(CLOUD_STORAGE_BUCKET) + len(CLOUD_STORAGE_BUCKET) + 1
	key = url[i:]
	key = urllib.unquote(key)
	bucket.delete_blob(key)

class FileUpload(webapp2.RequestHandler):
    
    def validate(self, file):
        if file['size'] < MIN_FILE_SIZE:
            file['error'] = 'File is too small'
        elif file['size'] > MAX_FILE_SIZE:
            file['error'] = 'File is too big'
        elif not ACCEPT_FILE_TYPES.match(file['type']):
            file['error'] = 'Filetype not allowed'
        else:
            return True
        return False

    def validate_redirect(self, redirect):
        if redirect:
            if REDIRECT_ALLOW_TARGET:
                return REDIRECT_ALLOW_TARGET.match(redirect)
            referer = self.request.headers['referer']
            if referer:
                from urlparse import urlparse
                parts = urlparse(referer)
                redirect_allow_target = '^' + re.escape(
                    parts.scheme + '://' + parts.netloc + '/'
                )
            return re.match(redirect_allow_target, redirect)
        return False

    def get_file_size(self, file):
        file.seek(0, 2)  # Seek to the end of the file
        size = file.tell()  # Get the position of EOF
        file.seek(0)  # Reset the file position to the beginning
        return size

    def write_blob(self, data, info):
        gcs1 = storage.Client()
        bucket = gcs1.get_bucket(CLOUD_STORAGE_BUCKET)
        
        key = imageUrl(info)
        blob = bucket.blob(key)
        
        try:
            blob.upload_from_string(data, content_type=info['type'])
        except Exception, e: #Failed to add to memcache
            logging.exception(e)
            return (None, None)
        if IMAGE_TYPES.match(info['type']):
            try:
                img = images.Image(image_data=data)
                img.resize(
                    width=THUMB_MAX_WIDTH,
                    height=THUMB_MAX_HEIGHT
                )
                thumbnail_data = img.execute_transforms()
                thumbnail_blob = bucket.blob(thumbnail(key))
                thumbnail_blob.upload_from_string(thumbnail_data, content_type=info['type'])
            except Exception, e: #Failed to resize Image or add to memcache
                logging.exception(e)
        return (blob.public_url, thumbnail_blob.public_url)

    def handle_upload(self):        
        results = []
        for name, fieldStorage in self.request.POST.items():
            if type(fieldStorage) is unicode:
                continue
            result = {}
            result['name'] = urllib.unquote(fieldStorage.filename)
            result['type'] = fieldStorage.type
            result['size'] = self.get_file_size(fieldStorage.file)
            if self.validate(result):
                key, thumbnail_key = self.write_blob(
                    fieldStorage.value,
                    result
                )
                if key is not None:
                    result['url'] = key
                    result['deleteUrl'] = result['url']
                    result['deleteType'] = 'DELETE'
                    if thumbnail_key is not None:
                        result['thumbnailUrl'] = thumbnail_key
                else:
                    result['error'] = 'Failed to store uploaded file.'
            results.append(result)
        return results

    def head(self):
        pass

    def get(self):
        self.redirect(self.request.host_url + '/' + 'basic-plus.html')

    def post(self):
        logger.info('------------ UploadHandler')
        logger.info(self.request.GET.__dict__)
        if (self.request.get('_method') == 'DELETE'):
            logger.info('------- DELETING --------')
            return self.delete()
        logger.info('------ UPLOADING --------')
        result = {'files': self.handle_upload()}
        s = json_stringify(result)
        redirect = self.request.get('redirect')
        if self.validate_redirect(redirect):
            return self.redirect(str(
                redirect.replace('%s', urllib.quote(s, ''), 1)
            ))
        if 'application/json' in self.request.headers.get('Accept'):
            self.response.headers['Content-Type'] = 'application/json'
        self.response.write(s)
        
class FileDelete(webapp2.RequestHandler):
    def post(self):
        logger.info('------------ DeleteHandler')
       
        try:
            url = self.request.POST.get('url')
            if url is not None:
                delete_with_thumbnail(url)
            self.response.write(json_stringify({'result': 'OK'}))
        except Exception, e: 
            logging.exception(e)
            self.response.write(json_stringify({'result': 'ERROR'}))    


