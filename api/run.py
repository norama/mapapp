from filereader import read_file

import sys

import logging

import time
timestr = time.strftime("%Y-%m-%d_%H-%M-%S")

logdir = 'api/logs'
logfile = 'runlog-{0}'.format(timestr)

#logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
#logger = logging.getLogger()
#fh = logging.FileHandler("{0}/{1}.log".format('logs', logfile))
#fh.setFormatter(formatter)
#logger.addHandler(fh)

loggingFormat = '%(asctime)s - %(levelname)s - %(message)s'
loggingDateFormat = '%Y-%m-%d %H:%M:%S'
logging.basicConfig(level=logging.INFO, format=loggingFormat, datefmt=loggingDateFormat)

logFormatter = logging.Formatter(loggingFormat, datefmt=loggingDateFormat)
logger = logging.getLogger()

fileHandler = logging.FileHandler("{0}/{1}.log".format(logdir, logfile))
fileHandler.setFormatter(logFormatter)
fileHandler.setLevel(logging.INFO)
logger.addHandler(fileHandler)

SYS_USER = 'system'

#consoleHandler = logging.StreamHandler()
#consoleHandler.setFormatter(logFormatter)
#consoleHandler.setLevel(logging.INFO)
#logger.addHandler(consoleHandler)

# logger.addHandler(logging.StreamHandler(sys.stdout))
# ch = logging.StreamHandler(sys.__stdout__)
# logger.addHandler(ch)

def import_item(url, _type):
	# print str(sys.__stdout__)
	logger.info('importing '+_type+': url="'+url+'"')
	try:
		pass
		# insert_external(url, _type, SYS_USER)
	except ValueError, e:
		logger.error('--> ERROR importing URL "'+url+'", type: '+_type)
		logger.error(e, exc_info=True)
	except Exception, e:
		logger.error('==> PROGRAM ERROR while importing URL "'+url+'", type: '+_type)
		logger.error(e, exc_info=True)

if __name__ == '__main__':
	if len(sys.argv) == 1:
		print 'Usage:'
		print '  python api/run.py <cmd with args> ...'
		print '  where <cmd with args> is either of:'
		print '    import_item <url> <type>'
		sys.exit()
		
	cmd = sys.argv[1].lower()
	if cmd == 'import_item':
		import_item(url=sys.argv[2], _type=sys.argv[3])
