import os
import json
import uuid
import logging

from collections import defaultdict

import webapp2
import micro_webapp2

from httplib2 import Http
from google.appengine.api import memcache
from google.appengine.ext.webapp import template

from oauth2client.contrib.appengine import OAuth2DecoratorFromClientSecrets
from apiclient.discovery import build

from oauth2client.client import Error


import actions

logger = logging.getLogger()

client_scopes = ['profile', 'email', 'https://www.googleapis.com/auth/plus.me']
# client_scopes = ['https://www.googleapis.com/auth/tasks']

client_keyfile = 'private/auth/keys/MapAppClientKeys.json'

client_decorator = OAuth2DecoratorFromClientSecrets(client_keyfile, client_scopes, 'Secrets file is missing or invalid.')


def ospath(path):
    return os.path.join(os.path.dirname(__file__), path)

def _http_auth():
    if client_decorator.has_credentials():
        try:
            return client_decorator.http()
        except Error:
            logger.error('Error during client_decorator.http()')
            logging.exception(exception)
    return None

def _userinfo():
    http_auth = _http_auth()
    if http_auth is not None:
        try:
            client_service = build(serviceName='people', version='v1', http=http_auth)
            userinfo = client_service.people().get(resourceName='people/me').execute()
            return userinfo
        except Error:
            logger.error('Error during client_decorator.http()')
            logging.exception(exception)
    return None

class Home(micro_webapp2.BaseHandler):
    def get(self):
        path = ospath('index.html')
        conf = {}
        self.response.out.write(template.render(path, conf))    


class Insert(micro_webapp2.BaseHandler):

    @client_decorator.oauth_aware
    def get(self):
        logger.info('******* GET *************')
        userinfo = _userinfo()
        if userinfo is not None:
            logger.info("userinfo")
            logger.info(json.dumps(userinfo, sort_keys=True, indent=4, separators=(',', ': ')))
            if 'values' in self.session:      
                logger.info('======================== session =======================')
                logger.info(self.session)
                actions.insert(self.session['values'])
            else:
                logger.info('------------------------ just reloading page -----------------------')
        else:
            self._authorize()
            return

        self.session.pop('values', None)     

        self.redirect('/')      


    @client_decorator.oauth_aware
    def post(self):   
        logger.info('******* POST *************')

        values = dict()
        for key in self.request.POST:
            values[key] = self.request.POST[key]
        self.session['values'] = values
        logger.info(self.session)

        if client_decorator.has_credentials():
            self.get() # actions.insert(self.request.POST)
        else:
            self._authorize()

    def _authorize(self):
        url = client_decorator.authorize_url()
        path = ospath('unauth.html')
        conf = {'authorize_url': url, 'cancel_url': self.request.application_url}
        self.response.out.write(template.render(path, conf))        

def handle_404(request, response, exception):
    logging.exception(exception)
    response.write('Oops! I could swear this page was here! Status code: 404')
    response.set_status(404)

def handle_500(request, response, exception):
    logging.exception(exception)
    response.write('A server error occurred! Status code: 500')
    response.set_status(500)



config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': '9bef0a38-8cd1-4b64-8113-19af63f7ab10' # uuid.uuid4().urn
}


app = micro_webapp2.WSGIApplication([
    ('/', Home),
    ('/insert', Insert),
    #webapp2.Route(r'/', handler=Insert, name='insert'),
    # webapp2.Route(r'/app', handler=Insert, name='insert2'),
    (client_decorator.callback_path, client_decorator.callback_handler())
    # webapp2.Route(client_decorator.callback_path, handler=client_decorator.callback_handler, name='oauth_callback'),
    # webapp2.Route(r'/app/insert', handler=Insert, name='insert'),
    #webapp2.Route(r'/sign', handler=Guestbook, name='sign'),
    # webapp2.Route(r'/guestbook/<guestbook_name:(.+)>', handler=MainPage, name='guestbook', handler_method='get_guestbook'),
], debug=True, config=config)

app.error_handlers[404] = handle_404
app.error_handlers[500] = handle_500

@app.route('/app/store', methods=['GET', 'POST'])
def store(request):
    logger = logging.getLogger()
    logger.info(request.__dict__)
    return json.dumps({'key1' : 'value1', 'key2' : 'value2'})