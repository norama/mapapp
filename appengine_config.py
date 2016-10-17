"""
`appengine_config.py` is automatically loaded when Google App Engine
starts a new instance of your application. This runs before any
WSGI applications specified in app.yaml are loaded.
"""

from google.appengine.ext import vendor
from gaesessions import SessionMiddleware

import sys
import os

# http://stackoverflow.com/questions/25915164/django-1-7-on-app-engine-importerror-no-module-named-msvcrt
on_appengine = os.environ.get('SERVER_SOFTWARE','').startswith('Development')
if on_appengine and sys.platform.startswith('win'):
   sys.platform = ''


def webapp_add_wsgi_middleware(app):
	app = SessionMiddleware(app, cookie_key="7bd96f1c-199e-4cac-9116-a2e0a89a4a80")
	return app


# Third-party libraries are stored in "lib", vendoring will make
# sure that they are importable by the application.
vendor.add('lib')
