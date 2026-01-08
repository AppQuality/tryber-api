FROM node:24-alpine3.22 AS builder

WORKDIR /app

ARG NPM_TOKEN  
COPY package.json package-lock.json ./

RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm ci && \
    rm -f .npmrc

COPY . .

RUN npm run build

FROM node:24-alpine3.22 AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./build
COPY --from=builder /app/src/routes ./src/routes
COPY --from=builder /app/.git/HEAD ./.git/HEAD
COPY --from=builder /app/.git/refs ./.git/refs

ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && \
    npm ci --omit=dev --ignore-scripts && \
    rm -f .npmrc && \
    npm cache clean --force

CMD ["node", "build/index.js"]