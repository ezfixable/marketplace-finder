import os
import requests

def push(title: str, message: str):
    user = os.getenv("PUSHOVER_USER")
    token = os.getenv("PUSHOVER_TOKEN")

    # Если переменных нет — просто логируем
    if not user or not token:
        print(f"[PUSHOVER disabled] {title}: {message}")
        return

    data = {"token": token, "user": user, "title": title, "message": message}
    try:
        r = requests.post("https://api.pushover.net/1/messages.json", data=data)
        print(f"[PUSHOVER] {r.status_code}: {r.text}")
    except Exception as e:
        print(f"[PUSHOVER error] {e}")
