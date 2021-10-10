from collections import defaultdict

import boto3
import time
import json
ec2 = boto3.client('ec2')
ssm = boto3.client('ssm')
client = boto3.client('s3')

"""
A tool for retrieving basic information from the running EC2 instances.
"""
def check_response(response_json):
    try:
        if response_json['ResponseMetadata']['HTTPStatusCode'] == 200:
            return True
        else:
            return False
    except KeyError:
        return False

def send_command(instance_id):
    response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="Copy-tagvalues",
        )

    if check_response(response):
        command_id = response['Command']['CommandId']
        return command_id

def lambda_handler(event, context):
# Connect to EC2
    describeInstance = ec2.describe_instances(Filters=[
            {
                'Name': 'tag:Type',
                'Values': ['SQL']
        }
    ])

    InstanceId=[]
    # fetchin instance id of the running instances
    for i in describeInstance['Reservations']:
        for instance in i['Instances']:
            if instance["State"]["Name"] == "running":
                InstanceId.append(instance['InstanceId'])

     # looping through instance ids
    commandId = []
    for instance_id in InstanceId:
        # command to be executed on instance
        command_id = send_command(instance_id)
        commandId.append(command_id)

    hostzone2=json.dumps(commandId)
    client.put_object(Body=hostzone2, Bucket='manojprobucket1', Key='ssm_command_id.json')

    return {
        'json': hostzone2,
        'command_id': commandId,

    }
