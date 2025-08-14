# Dockerfile for the API service
FROM node:23.4.0

RUN npm install -g nodemon

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install

EXPOSE 5000

CMD ["npm","run" ,"start"]
