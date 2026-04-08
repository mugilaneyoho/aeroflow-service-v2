FROM node:20

WORKDIR /

COPY package*.json ./

RUN npm i

COPY . .


CMD [ "npm","start" ]