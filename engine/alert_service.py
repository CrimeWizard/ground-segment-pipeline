# engine/alert_service.py

import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

def send_alert_email(location, alert_type, current_value, threshold_value, recipient):
    """
    Sends an operational alert email via AWS SES.
    """
    SENDER = os.getenv("ALERT_SENDER_EMAIL", "alerts@orbital-intel.com")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    
    subject = f"CRITICAL: Maritime Congestion Alert - {location}"
    
    if alert_type == "CAPACITY_BREACH":
        body_text = (f"Operational Alert: {location}\n\n"
                     f"Physical capacity limit breached.\n"
                     f"Current Vessel Count: {current_value}\n"
                     f"Max Capacity Threshold: {threshold_value}\n\n"
                     "Action Recommended: Divert inbound freight dispatch.")
    else:
        body_text = (f"Operational Alert: {location}\n\n"
                     f"Congestion velocity spike detected.\n"
                     f"Current Vessel Count: {current_value}\n"
                     f"Velocity Delta: +{threshold_value:.1f}%\n\n"
                     "Action Recommended: Monitor berth availability.")

    # In a real environment with AWS SES credentials, we would use boto3
    # For now, we simulate the dispatch or use SMTP if credentials exist.
    print(f"--- EMAIL DISPATCH SIMULATION ---")
    print(f"From: {SENDER}")
    print(f"To: {recipient}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body_text}")
    print(f"---------------------------------")

    if os.getenv("AWS_ACCESS_KEY_ID"):
        client = boto3.client('ses', region_name=AWS_REGION)
        try:
            response = client.send_email(
                Destination={'ToAddresses': [recipient]},
                Message={
                    'Body': {'Text': {'Charset': "UTF-8", 'Data': body_text}},
                    'Subject': {'Charset': "UTF-8", 'Data': subject},
                },
                Source=SENDER,
            )
            print(f"Email sent! Message ID: {response['MessageId']}")
        except ClientError as e:
            print(f"AWS SES Error: {e.response['Error']['Message']}")
    else:
        print("Skipping AWS dispatch: No AWS credentials found in .env")
