const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Book Catalogue API',
    description: 'This API handles operations related to books in the catalog.',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './swagger-output.json'; 
const routes = ['./app.js'];

swaggerAutogen(outputFile, routes, doc);
