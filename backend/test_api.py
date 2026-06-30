import urllib.request, json
email = 'test999@test.com'
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/register/', data=json.dumps({'email': email, 'first_name': 'T', 'last_name': 'T', 'password': 'Password123!', 'confirm_password': 'Password123!'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
except Exception:
    pass

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login/', data=json.dumps({'email': email, 'password': 'Password123!'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['tokens']['access']

req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/me/update/', data=json.dumps({'first_name': 'NewName'}).encode('utf-8'), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}, method='PATCH')
try:
    res2 = urllib.request.urlopen(req2)
except urllib.error.HTTPError as e:
    html = e.read().decode('utf-8')
    import re
    m = re.search(r'(?s)<textarea id="traceback_area".*?>(.*?)</textarea>', html)
    if m:
        print(m.group(1).strip().replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>'))
    else:
        print('Could not parse traceback')
