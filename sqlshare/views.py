from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.conf import settings
from django.utils import simplejson as json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.core.context_processors import csrf
from sqlshare.models import UserFile
import urllib
import re

import httplib

@login_required
@csrf_protect
def home(request):
   user = request.user
   c = { "user":user }
   c.update(csrf(request))
   print csrf(request)
   return render_to_response('home.html', c)

@login_required
@csrf_protect
def user(request):
    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()
    conn.putrequest('GET', '/REST.svc/v1/user/%s' % (request.user))
    conn.putheader('Accept', 'application/json')
    conn.endheaders()
    response = conn.getresponse()

    code = response.status
    content = response.read()

    if code == 404:
        conn.putrequest('PUT', '/REST.svc/v1/user/%s' % (request.user))
        conn.putheader('Accept', 'application/json')
        conn.putheader('Content-Type', 'application/json')
        conn.putheader('Content-Length', '0')
        conn.endheaders()
        response = conn.getresponse()
        code = response.status
        content = response.read()


    user = request.user
    user_response = HttpResponse(content)
    user_response.status_code = code

    return user_response

@login_required
@csrf_protect
def proxy(request, path):

    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()

    body = request.read()

    sqlshare_secret = settings.SQLSHARE_SECRET
    conn.putrequest(request.META['REQUEST_METHOD'], '/'+urllib.quote(path))
    conn.putheader('Authorization', 'ss_trust %s : %s' % (request.user, sqlshare_secret))
    conn.putheader('Accept', 'application/json')
    conn.putheader('Content-type', 'application/json')

    if len(body) > 0:
        conn.putheader('Content-Length', len(body))

    conn.endheaders()

    if len(body) > 0:
        conn.send(body)

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
        if name == "connection":
            continue

        # django 
        if name == "location":
            response[name] = "/sqlshare/proxy/"+value
        else:
            response[name] = value

    response.status_code = ss_response.status

    return response

@login_required
@csrf_protect
def upload(request):
    user_file = UserFile(user_file=request.FILES["file"])
    user_file.save()

    content = _getMultipartData(user_file.user_file.path, 0, append_new_line=True)

    conn = httplib.HTTPSConnection(
        'sqlshare-rest-test.cloudapp.net'
    )
    conn.connect()

    sqlshare_secret = settings.SQLSHARE_SECRET
    conn.putrequest('POST', "/REST.svc/v3/file")
    conn.putheader('Authorization', 'ss_trust %s : %s' % (request.user, sqlshare_secret))
    conn.putheader('Accept', 'application/json')
    conn.putheader('Content-type', 'application/octet-stream')

    conn.putheader('Content-Length', len(content))

    conn.endheaders()

    conn.send(content)

    ss_response = conn.getresponse()

    headers = ss_response.getheaders()
    response = ss_response.read()

    ss_id = json.loads(response)

    ## This is the old File::Parser bit

    conn.putrequest('GET', "/REST.svc/v3/file/%s/parser" % ss_id)
    conn.putheader('Authorization', 'ss_trust %s : %s' % (request.user, sqlshare_secret))
    conn.putheader('Accept', 'application/json')

    conn.endheaders()

    parser_response = conn.getresponse()


    json_values = json.loads(parser_response.read())
    json_values["sol_id"] = user_file.id
    json_values["ss_id"] = ss_id

    
    json_response = json.dumps(json_values)

    return HttpResponse(json_response)

def _getMultipartData(file_name, position, append_new_line=False):
    upload_chunk_size = 10485760

    handle = open(file_name, 'r')
    handle.seek(position * upload_chunk_size, 0)

    chunk = handle.read(upload_chunk_size)

    if append_new_line:
        chunk += "\n\n"

    boundary = '----------ThIs_Is_tHe_bouNdaRY_$'
    name = re.match(".*/([^/]+)$", file_name).group(1)

    multipart_data = "\r\n".join([
        "--%s" % boundary,
        "Content-Disposition: form-data; name=\"file\" filename=\"%s\";" % name,
        "",
        chunk,
        "--%s--" % boundary,
        ""
    ])

    return multipart_data
