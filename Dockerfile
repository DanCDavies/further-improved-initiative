FROM node:18-slim
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
RUN npm install -g grunt

WORKDIR /usr/src/app
COPY package*.json ./
RUN mkdir -p ./public/webfonts
RUN npm install

COPY . .

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
RUN if [ "$NODE_ENV" = "production" ]; then grunt --no-color build_min; else grunt --no-color build_dev; fi

EXPOSE 80
CMD [ "node", "server/server.js" ]
