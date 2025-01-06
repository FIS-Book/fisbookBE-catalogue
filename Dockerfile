FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY authentication/ ./authentication
COPY bin/ ./bin
COPY models/ ./models
COPY routes/ ./routes
COPY services/ ./services
COPY swagger-docs/ ./swagger-docs
COPY app.js .
COPY db.js .

EXPOSE 3000

CMD npm run swagger && npm start