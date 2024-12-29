FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY bin/ ./bin
COPY models/ ./models
COPY routes/ ./routes
COPY services/ ./services
COPY app.js .
COPY swagger-docs/ ./swagger-docs
COPY .env .

EXPOSE 3000

CMD npm start