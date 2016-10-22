from itemloader import read_file

import sys

if __name__ == '__main__':
	filename = sys.argv[1]
	s = read_file(filename)
	print s