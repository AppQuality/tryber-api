#!/bin/bash
set -euo pipefail

# enable and start docker service
systemctl enable docker.service
systemctl start docker.service

# login to ecr
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 163482350712.dkr.ecr.eu-west-1.amazonaws.com

# read docker image version from manifest
DOCKER_IMAGE=$(cat "/home/ec2-user/crowd-api/docker-image.txt")
DOCKER_COMPOSE_FILE="/home/ec2-user/$APPLICATION_NAME/docker-compose.yml"
INSTANCE_ID=$(wget -q -O - http://169.254.169.254/latest/meta-data/instance-id)

# pull docker image from ecr
docker pull 163482350712.dkr.ecr.eu-west-1.amazonaws.com/$DOCKER_IMAGE

# get env variables from parameter store
mkdir -p /var/docker/keys
mkdir -p /home/ec2-user/$APPLICATION_NAME
aws ssm get-parameter --region eu-west-1 --name "/$DEPLOYMENT_GROUP_NAME/.env" --with-decryption --query "Parameter.Value" | sed -e 's/\\n/\n/g' -e 's/\\"/"/g' -e 's/^"//' -e 's/"$//' > /var/docker/.env
aws ssm get-parameter --region eu-west-1 --name "/$DEPLOYMENT_GROUP_NAME/private_tw.pem" --with-decryption --query "Parameter.Value" | sed -e 's/\\n/\n/g' -e 's/\\"/"/g' -e 's/^"//' -e 's/"$//' > /var/docker/keys/private_tw.pem


if test -f "$DOCKER_COMPOSE_FILE"; then
    IS_RUNNING=$(docker ps -a | grep $DOCKER_IMAGE| wc -l)
    if [ "$IS_RUNNING" -eq "1" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE down
    fi
fi

echo "
version: '3'
services:
  app:
    image: 163482350712.dkr.ecr.eu-west-1.amazonaws.com/$DOCKER_IMAGE
    restart: always
    env_file:
      - /var/docker/.env
    ports:
      - '80:80'
    environment:
      - PORT=80
    volumes:
      - /var/docker/keys:/app/keys
    logging:
      driver: awslogs
      options:
        awslogs-region: eu-west-1
        awslogs-group: "${APPLICATION_NAME}-${DEPLOYMENT_GROUP_NAME}"
        awslogs-stream: ${INSTANCE_ID}
        awslogs-create-group: 'true'
" > $DOCKER_COMPOSE_FILE


docker-compose -f $DOCKER_COMPOSE_FILE up -d
