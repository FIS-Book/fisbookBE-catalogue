const mongoose = require('mongoose');
 
const bookSchema = new mongoose.Schema({
    isbn: {
        type: String, 
        required: true,
        unique: true, 
        match: /^(?:\d{9}X|\d{10}|\d{13})$/,
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    publicationYear: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    totalPages: {
        type: Number,
        required: true
    },
    categories: {
        type: [String],
        required: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    totalRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    inReadingLists: {
        type: Number,
        default: 0
    },
    formats: {
        type: [String],
        required: true
    }
});
 

bookSchema.statics.validateISBNFormat = function (isbn) {
    const isbnRegex = /^(?:\d{9}X|\d{10}|\d{13})$/;
    return isbnRegex.test(isbn);
}

bookSchema.index({ isbn: 1 }); 
const Book = mongoose.model('Book', bookSchema);
module.exports = Book;