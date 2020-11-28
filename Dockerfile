FROM node:buster-slim as builder-angular
RUN apt-get update
RUN apt-get -y install libgtkextra-dev libgconf2-dev libnss3 libasound2 libxtst-dev libxss1

ADD ./angular-app/package.json /tmp/package.json
RUN cd /tmp/ && npm install
RUN mkdir -p /ng-app && cp -a /tmp/node_modules /ng-app

COPY ./angular-app/ /ng-app
WORKDIR /ng-app
RUN npm run build