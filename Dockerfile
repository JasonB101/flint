FROM node:18.12.0-alpine

COPY package.json /app/
COPY . /app/

WORKDIR /app

RUN npm install

CMD ["node", "server.js"]

WORKDIR /client

RUN npm install

