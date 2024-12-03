var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
// Mongo DB
const mongoose = require('mongoose');
// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json'); 

var catalogueRouter = require('./routes/books');

var app = express();
 
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    console.error('Error Invalid JSON format:', err.message);
    return res.status(400).json({ 
      error: 'Invalid JSON format', 
      message: err.message 
    });
  }
  next(err);
});

app.use('/api/v1/books', catalogueRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Mongo DB setup
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority&appName=${process.env.MONGO_DATABASE}`);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB Atlas connection error:'));
db.once('open', function() {
  console.log("Successfully connected to MongoDB Atlas");
});

module.exports = app;