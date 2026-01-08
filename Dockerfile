FROM node:24-alpine3.22 as node
FROM alpine:3.16 as base

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

ARG NPM_TOKEN  
RUN echo //registry.npmjs.org/:_authToken=${NPM_TOKEN} > .npmrc
COPY package.json package-lock.json ./
RUN npm ci && \
    rm -f .npmrc && \
    npm i -g npm-run-all

COPY . .

RUN npm run build
FROM node:24-alpine3.22 as web

COPY --from=base /dist /app/build
COPY package*.json /app/
COPY --from=base /src/routes /app/src/routes
COPY --from=base /.git/HEAD /app/.git/HEAD
COPY --from=base /.git/refs /app/.git/refs

WORKDIR /app
ARG NPM_TOKEN  
RUN echo //registry.npmjs.org/:_authToken=${NPM_TOKEN} > .npmrc && \
    npm ci --omit=dev --ignore-scripts && \
    rm -f .npmrc && \
    rm -rf /var/cache/apk/* && \
    npm cache clean --force

CMD node build/index.js