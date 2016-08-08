"""`main` is the top level module for your Flask application."""

import json
import logging
import webapp2
import micro_webapp2

import actions


class Insert(webapp2.RequestHandler):
    def post(self):
        logger = logging.getLogger()
        logger.info("FORM")
        logger.info(self.request.POST)
        return actions.insert(self.request.POST)

def handle_404(request, response, exception):
    logging.exception(exception)
    response.write('Oops! I could swear this page was here! Status code: 404')
    response.set_status(404)

def handle_500(request, response, exception):
    logging.exception(exception)
    response.write('A server error occurred! Status code: 500')
    response.set_status(500)


config = {'foo': 'bar'}


app = micro_webapp2.WSGIApplication([
    webapp2.Route(r'/app/insert', handler=Insert, name='insert'),
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