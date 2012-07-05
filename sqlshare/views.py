from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.conf import settings
import httplib

def home(request):
   return render_to_response('home.html', {})

def user(request):
    return HttpResponse('{"schema":"pmichaud","username":"pmichaud"}')


def proxy(request, path):
    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()

    print request

    sqlshare_secret = settings.SQLSHARE_SECRET
    conn.putrequest(request.META['REQUEST_METHOD'], '/'+path)
    conn.putheader('Authorization', 'ss_trust pmichaud : %s' % (sqlshare_secret))
    conn.putheader('Accept', 'application/json')
    conn.putheader('Content-type', 'application/json')
    conn.endheaders()
    ss_response = conn.getresponse()

    headers = ss_response.getheaders()
    response = HttpResponse(ss_response.read())

    for header in headers:
        name = header[0]
        value = header[1]
        if name == "x-powered-by":
            continue
        if name == "client-peer":
            continue
        if name == "x-aspnet-version":
            continue
        if name == "server":
            continue
        if name == "transfer-encoding":
            continue

        response[name] = value

    print ss_response
    print ss_response.status
    response.status_code = ss_response.status

    return response

