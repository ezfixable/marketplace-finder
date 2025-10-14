```python
import os, smtplib
from email.mime.text import MIMEText

SMTP_HOST=os.getenv('SMTP_HOST')
SMTP_PORT=int(os.getenv('SMTP_PORT') or 587)
SMTP_USER=os.getenv('SMTP_USER')
SMTP_PASS=os.getenv('SMTP_PASS')

def send_email(to:str, subject:str, body:str):
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS):
        return False
    msg = MIMEText(body)
    msg['Subject']=subject
    msg['From']=SMTP_USER
    msg['To']=to
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(SMTP_USER, [to], msg.as_string())
    return True
