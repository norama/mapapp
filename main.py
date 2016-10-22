import os
import json
import uuid
import logging

from collections import defaultdict

import webapp2
import micro_webapp2

from gaesessions import get_current_session
from api.filereader import read_json, read_file
import api.stringstore as stringstore

from httplib2 import Http
from google.appengine.api import memcache
from google.appengine.ext.webapp import template

from oauth2client.contrib.appengine import OAuth2DecoratorFromClientSecrets
from apiclient.discovery import build

from oauth2client.client import Error


import api.actions as actions
from api.fileupload import FileUpload, FileDelete

logger = logging.getLogger()

client_scopes = ['profile', 'email', 'https://www.googleapis.com/auth/plus.me']
# client_scopes = ['https://www.googleapis.com/auth/tasks']

client_keyfile = 'private/auth/keys/MapAppClientKeys.json'

client_decorator = OAuth2DecoratorFromClientSecrets(client_keyfile, client_scopes, 'Secrets file is missing or invalid.')

types_file = 'config/external/types.json'

def ospath(path):
    return os.path.join(os.path.dirname(__file__), path)

def _http_auth():
    if client_decorator.has_credentials():
        try:
            return client_decorator.http()
        except Error as error:
            logger.error('Error during client_decorator.http()')
            logging.exception(error)
    return None

def _userinfo():
    http_auth = _http_auth()
    if http_auth is not None:
        try:
            client_service = build(serviceName='people', version='v1', http=http_auth)
            userinfo = client_service.people().get(resourceName='people/me').execute()
            return _extract(userinfo)
        except Error as error:
            logger.error('Error during user info service')
            logging.exception(error)
    return None

def _extract(userinfo):
    # logger.info(json.dumps(userinfo, indent=4))
    res = dict()
    res['email'] = _extract_email(userinfo)
    res['id'] = userinfo['resourceName']
    res['name'] = userinfo['names'][0]['displayName']
    res['avatar'] = userinfo['photos'][0]['url']
    return res

def _extract_email(userinfo):
	emails = userinfo['emailAddresses']
	if emails:
		return emails[0]['value']
	else:
		return None

class SessionHandler():
    def _conf(self, conf=None):
        return self._item('conf', conf, {})

    def _state(self, state=None):
        return self._item('state', state, self._defstate())

    def _user(self, user=None):
        return self._item('user', user)
	
    def _types(self, types=None):
        return self._item('types', types)

    def _error(self, error=None):
        return self._item('error', error) 

    def _item(self, key, item=None, defval=None):
        session = get_current_session()
        if item is None:
            if session.has_key(key):
                return session[key]
            else:
                return defval
        else:
            session[key] = item
            return item

    def _defstate(self):
        if self._user() is None:
            return 'init'
        else:
            return 'loggedin'

    def _clear_request(self):
        session = get_current_session()
        session.pop('conf', None)  
        error = session.pop('error', None) 
        if error is not None:
            session.pop('state', None)  

    def _new(self):
        session = get_current_session()
        if session.is_active():
            session.terminate()

class Base(webapp2.RequestHandler):
    def __init__(self, request, response):
        self.initialize(request, response)
        self.sh = SessionHandler()

    def _post_values(self):
        conf = dict()
        for key in self.request.POST:
            conf[key] = self.request.POST[key]
        return conf

    def _user(self):
        user = self.sh._user()
        if user is None:
            raise ValueError('No user - log in required to perform action.')
        return user

    def _rowid(self):
        user = self._user()
        lat = self.request.POST['lat']
        lng = self.request.POST['lng']
        return actions.rowid(lat, lng)

class Home(Base):
    def get(self):
        path = ospath('index.html')
        params = self._template_params()
        logger.info('---------- HOME TEMPLATE PARAMS -----------')
        logger.info(params)
        self.response.out.write(template.render(path, params)) 
        self.sh._clear_request()
		
    def _types(self):
        types = self.sh._types()
        if types is not None:
            return types
        user = self.sh._user()
        if user is None:
            types = read_json(types_file)
        else: 
            key = self._types_key(user)
            if not stringstore.exists(key):
                stringstore.write(key, filename='config/external/types.json')
            types_str = stringstore.read(key)
            types = json.loads(types_str)
        types = ','.join(types)
        self.sh._types(types)
        return types
	
    def _types_key(self, user):
        if user['email']:
            return 'types/' + user['email']
        else:
            return 'types/' + user['id']

    def _template_params(self):
        params = dict()
        params.update(self.sh._conf())
        params['state'] = self.sh._state()
        error = self.sh._error()
        if error is not None:
            params['error'] = error
        user = self.sh._user()
        if user is not None:
            params['user'] = user
        params['types'] = self._types()
        return params


class Login(Base):

    @client_decorator.oauth_aware
    def get(self):
        if client_decorator.has_credentials():
            if self._login():
                self.redirect('/') 
        self._authorize()

    def post(self):
        self.sh._new()
        self.sh._state('init')
        self.sh._conf(self._post_values())
        self.get()

    def _login(self):
        userinfo = _userinfo()
        if userinfo is None:
            self.sh._state('init')
            logger.info('Login failed.')
            return False               
        else:
            self.sh._state('loggedin')
            self.sh._user(userinfo)
            return True
            # logger.info(json.dumps(userinfo, sort_keys=True, indent=4, separators=(',', ': ')))

    def _authorize(self):
        url = client_decorator.authorize_url()
        path = ospath('unauth.html')
        conf = {'authorize_url': url, 'cancel_url': self.request.application_url}
        self.response.out.write(template.render(path, conf))        


class Logout(Base):

    def post(self):
        self.sh._new()
        self.sh._state('init')
        self.sh._conf(self._post_values())
        self.redirect('/')


class Insert(Base):

    def post(self):
        user = self._user()
        values = self._post_values()
        return actions.insert(values, user['id'])
	
class InsertExternal(Base):

    def post(self):
        user = self._user()
        values = self._post_values()
        return actions.insert_external(values['url'], values['type'], user['id'])

class Edit(Base):

    def post(self):
        user = self._user()
        rowid = self._rowid()
        values = self._post_values()
        return actions.update(rowid, values, user['id'])

class Delete(Base):

    def post(self):
        user = self._user()
        rowid = self._rowid()
        return actions.delete(rowid, user['id'])


def handle_404(request, response, exception):
    logging.exception(exception)
    response.write('Oops! I could swear this page was here! Status code: 404, Details: ' + repr(exception))
    response.set_status(404)

def handle_500(request, response, exception):
    logging.exception(exception)
    response.write('A server error occurred! Status code: 500, Details: ' + repr(exception))
    response.set_status(500)



config = {}
# config['webapp2_extras.sessions'] = {
#     'secret_key': '9bef0a38-8cd1-4b64-8113-19af63f7ab10', # uuid.uuid4().urn
#     'session_backend': 'memcache'
# }


app = micro_webapp2.WSGIApplication([
    ('/', Home),
    ('/index.html', Home),
    ('/add', Insert),
	('/externalitem', InsertExternal),
    ('/edit', Edit),
    ('/delete', Delete),
    ('/login', Login),
    ('/logout', Logout),
    ('/fileupload', FileUpload),
    ('/fileupload/delete', FileDelete),
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

@app.route('/rowid', methods=['GET', 'POST'])
def rowid(request):
    return json.dumps(actions.rowid(request.params['lat'], request.params['lng']))