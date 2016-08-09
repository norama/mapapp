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


from oauth2client.contrib.appengine import OAuth2Decorator
from oauth2client.contrib.appengine import OAuth2DecoratorFromClientSecrets
from apiclient.discovery import build


import actions

client_scopes = ['profile', 'email', 'https://www.googleapis.com/auth/plus.me']
# client_scopes = ['https://www.googleapis.com/auth/tasks']

client_keyfile = 'private/auth/keys/MapAppClientKeys.json'

client_decorator = OAuth2DecoratorFromClientSecrets(client_keyfile, client_scopes)




class Insert(micro_webapp2.BaseHandler):

    @client_decorator.oauth_aware
    def get(self):
        logger = logging.getLogger() 
        if client_decorator.has_credentials():
            http_auth = client_decorator.http()
            client_service = build(serviceName='people', version='v1', http=http_auth)
            userinfo = client_service.people().get(resourceName='people/me').execute()
            logger.info("userinfo")
            logger.info(json.dumps(userinfo, sort_keys=True, indent=4, separators=(',', ': ')))
            if 'values' in self.session:      
                logger.info('======================== session =======================')
                logger.info(self.session)
                actions.insert(self.session['values'])
            else:
                logger.info('------------------------ just reloading page -----------------------')
        else:
            logger.info('------------------------ Unauthorized reloading page -----------------------')

        self.session.pop('values', None)           

        path = os.path.join(os.path.dirname(__file__), 'public/index.html')
        template_values = {}
        self.response.out.write(template.render(path, template_values))
        # return 'OK' #template.render(path, template_values)
        # return json.dumps(self.session)

    @client_decorator.oauth_aware
    def post(self):
        logger = logging.getLogger()       
        logger.info('POST')
        logger.info(self.request.POST)
        values = self.request.POST
        allValues = defaultdict(lambda: '')
        for key in values:
            allValues[key] = values[key]
        self.session['values'] = allValues
        if client_decorator.has_credentials():
            self.get() # actions.insert(self.request.POST)
        else:
            url = client_decorator.authorize_url()
            path = os.path.join(os.path.dirname(__file__), 'unauth.html')
            self.response.out.write(template.render(path, {'authorize_url': url, 'cancel_url': self.request.application_url}))

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
    ('/', Insert),
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