// Mongo DB
const mongoose = require('mongoose');

//Mongo DB setup
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority&appName=${process.env.MONGO_DATABASE}`);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB Atlas connection error:'));
db.once('open', function() {
  console.log("Successfully connected to MongoDB Atlas");
});

module.exports = db;