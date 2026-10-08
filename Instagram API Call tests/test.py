import os
import requests

ACCESS_TOKEN = "EAAOhyltO1f0BSkyf7ZCbx8AZCDC3UcZB5x8ZCIbOQTv3uTnVJfldoDNORTbSRMwFULsxNRqiw1mpYd20Fa5K2xK6NQ7gJO5YZBI5RP47NN5UczOxizoJgvRDsrS65djPreLHR7xBvym67yZC7rNr65inx7PH06dSmYaBPhOHLtAZByXnh02ZA17HNJ6BMLncMTNpgYw5XyMZBiTwUzFtRlFtLOWosun4bfvwiSrab"

r = requests.get(
    "https://graph.facebook.com/v23.0/me/accounts",
    params={
        "fields": "name,instagram_business_account{id,username}",
        "access_token": ACCESS_TOKEN,
    },
)
print(r.json())