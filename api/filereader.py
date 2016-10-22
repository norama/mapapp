import json

def read_json(path):
	return json.loads(read_file(path))

def read_file(path):
	try:
		f = open(path, 'r')
	except IOError:
		raise ValueError('IOError while opening file: ' + path)
	s = f.read()
	f.close()
	return s