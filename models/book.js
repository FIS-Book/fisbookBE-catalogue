const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: true
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

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;