from gcloud import storage
from itemloader import read_file

import os
import sys
import json

import logging

logger = logging.getLogger()

CLOUD_STORAGE_BUCKET = os.environ['CLOUD_STORAGE_BUCKET']

def get_blob(key):
	bucket = storage.Client().get_bucket(CLOUD_STORAGE_BUCKET)
	return bucket.blob(key)

def write(key, string=None, filename=None):
	blob = get_blob(key)
	try:
		if string is not None:
			blob.upload_from_string(string)
		elif filename is not None:
			blob.upload_from_string(read_file(filename))
		else:
			logger.error('string or filename should be specified')
			return None
		return blob.public_url
	except Exception, e: 
		logger.exception(e)
		return None
	
def read(key):
	blob = get_blob(key)
	if blob.exists():
		return blob.download_as_string()
	else:
		return None
	
def exists(key):
	blob = get_blob(key)
	return blob.exists()
	
	
if __name__ == '__main__':
	key = sys.argv[1]
	string = sys.argv[2]
	url = write(key, string=string)
	print url