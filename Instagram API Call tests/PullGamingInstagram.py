import requests

#Failed
ACCESS_TOKEN = "EAAOhyltO1f0BSvRsZByJh2kfwy31cojZBFCVwMGuiTw4QhiEymybxwoLYlcl2u8E3x0Vn0cziVKQJZAt1KbZAisH1xALS7dRWZB9LBOakno56JudZBIEnpZBPApqGeUZCPJtJvqwQjurCFSnWLKWKkXtthn5vKfLaWtAHH2ychi4Ok0olr1JYu2HilXhifsCENYy5RRn4jfE4far10XMzd0udzoZBKL9IqxaRg5VEs51tZAsiFgO0OT78oRUWof6Y4LdSSGdoQmJp6ZA0KifP63FvVZCNoaPtAZDZD"
INSTAGRAM_USER_ID = "122095444605505332"

url = "https://graph.facebook.com/v23.0/ig_hashtag_search"

params = {
    "user_id": INSTAGRAM_USER_ID,
    "q": "gaming",
    "access_token": ACCESS_TOKEN
}

response = requests.get(url, params=params)

print("Status:", response.status_code)
print("Response:", response.text)