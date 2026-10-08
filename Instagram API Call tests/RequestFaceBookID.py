import requests

#Works
ACCESS_TOKEN = "EAAOhyltO1f0BSv0110YFjSykTJszIAq5AuTvxyiwrcSxgUZC990Y7zPtuhl3VZCMehUfmbxRdSJtLNd86OZBjIIdzwZA3buSNZCahrF0mrGZAWbimlV8dFbIECVCmzCZCpFM0WVtTerM3wTfvpXFRPF3RFZCtF6oPMQdoWMfcoNTMGUAgTaSgwmvZAQR9osWU5MUpJTZBZARc5oGkCM4AmjzVUz4jroAZC3m54UgiNAw6bVpHKTG7tlP5CyZAKnfDV9db5b2mOiPDq5CoPXyG0DscNzIoxXHC"

url = "https://graph.facebook.com/v23.0/me"

params = {
    "fields": "id,name",
    "access_token": ACCESS_TOKEN
}

response = requests.get(url, params=params)

print(response.status_code)
print(response.text)