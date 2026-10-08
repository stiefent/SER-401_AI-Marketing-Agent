import requests
from getpass import getpass

#Works
ACCESS_TOKEN = getpass("Enter your Facebook Access Token: ")

url = "https://graph.facebook.com/v23.0/me"

params = {
    "fields": "id,name",
    "access_token": ACCESS_TOKEN
}

response = requests.get(url, params=params)

print(response.status_code)
print(response.text)