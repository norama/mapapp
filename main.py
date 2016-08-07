"""`main` is the top level module for your Flask application."""

import json
import logging
from flask import request

import actions

# Import the Flask Framework
from flask import Flask
app = Flask(__name__)
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.


@app.route('/app/hello', methods=['GET', 'POST'])
def hello():
    """Return a friendly HTTP greeting."""
    return 'Hello World!'

@app.route('/app/store', methods=['GET', 'POST'])
def store():
    return json.dumps({'key1' : 'value1', 'key2' : 'value2'})

@app.route('/app/insert', methods=['POST'])
def insert():
	# logger = logging.getLogger()
	# logger.info("Request: ")
	# logger.info(request.form['title'])
	return actions.insert(request.form)

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500
