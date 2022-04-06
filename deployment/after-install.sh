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

source /var/docker/.env
if test -f "$DOCKER_COMPOSE_FILE"; then
    set +e
    IS_RUNNING=$(docker ps -a | grep $DOCKER_IMAGE| wc -l)
    set -e
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
    ports:
      - '80:80'
    environment:
      - PORT=80
      - API_ROOT=${API_ROOT}
      - SENDGRID_KEY=${SENDGRID_KEY}
      - DEFAULT_SENDER_MAIL=${DEFAULT_SENDER_MAIL}
      - DEFAULT_SENDER_NAME=${DEFAULT_SENDER_NAME}
      - DEFAULT_CATEGORY=${DEFAULT_CATEGORY}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=${JWT_EXPIRATION}
      - WP_LOGGED_IN_KEY=${WP_LOGGED_IN_KEY}
      - WP_LOGGED_IN_SALT=${WP_LOGGED_IN_SALT}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - CROWD_URL=${CROWD_URL}
      - PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID}
      - PAYPAL_SECRET=${PAYPAL_SECRET}
      - RECEIPT_GENERATE_SNS_ARN=${RECEIPT_GENERATE_SNS_ARN}
      - AWS_REGION=${AWS_REGION}
      - TRANSFERWISE_API_KEY=${TRANSFERWISE_API_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - PAYMENT_COMPLETED_EMAIL=${PAYMENT_COMPLETED_EMAIL}
      - PAYMENT_REQUESTED_EMAIL=${PAYMENT_REQUESTED_EMAIL}
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
