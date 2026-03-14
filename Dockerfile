# Stage 1: Build
FROM node:18-slim AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN mkdir -p ./public/webfonts
RUN npm ci

COPY . .

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN if [ "$NODE_ENV" = "production" ]; then npx grunt --no-color build_min; else npx grunt --no-color build_dev; fi

# Stage 2: Runtime
FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN mkdir -p ./public/webfonts && npm ci --omit=dev

COPY --from=build /usr/src/app/server ./server
COPY --from=build /usr/src/app/common ./common
COPY --from=build /usr/src/app/html ./html
COPY --from=build /usr/src/app/public ./public

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

EXPOSE 80
CMD [ "node", "server/server.js" ]
