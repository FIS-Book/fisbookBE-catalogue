// Mongo DB
const mongoose = require('mongoose');

//Mongo DB setup
mongoose.connect(`${process.env.MONGO_URI_CATALOGUE}`);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB Atlas connection error:'));
db.once('open', function() {
  console.log("Successfully connected to MongoDB Atlas");
});

module.exports = db;