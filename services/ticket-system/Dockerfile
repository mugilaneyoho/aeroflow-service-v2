FROM node:20

WORKDIR /

COPY package*.json ./

RUN npm ci

COPY . .


CMD [ "npm","start" ]