"""
`appengine_config.py` is automatically loaded when Google App Engine
starts a new instance of your application. This runs before any
WSGI applications specified in app.yaml are loaded.
"""

from google.appengine.ext import vendor
from gaesessions import SessionMiddleware
def webapp_add_wsgi_middleware(app):
	app = SessionMiddleware(app, cookie_key="7bd96f1c-199e-4cac-9116-a2e0a89a4a80")
	return app


# Third-party libraries are stored in "lib", vendoring will make
# sure that they are importable by the application.
vendor.add('lib')
