const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: true,
        unique: true,
        match:  [/^(?:\d{9}X|\d{10}|\d{13})$/, 'Invalid ISBN format'],
        validate: {
            validator: function(value) {
                return value.length === 10 || value.length === 13;
            },
            message: 'The ISBN must have 10 or 13 characters.'
        }
    },
    title: {
        type: String,
        required: true,
        minlength: [3, 'The title must be at least 3 characters long.'],
        maxlength: [121, 'The title cannot be longer than 121 characters.']
    },
    author: {
        type: String,
        required: true
    },
    publicationYear: {
        type: Number,
        required: true,
        min: [1900, 'The publication year must be greater than or equal to 1900.'],
        max: [new Date().getFullYear(), `The publication year cannot be greater than the current year (${new Date().getFullYear()}).`]
    },
    description: {
        type: String,
        required: true,
        minlength: [100, 'The description must be at least 100 characters long.'],
        maxlength: [700, 'The description cannot be more than 700 characters long.']
    },
    language: {
        type: String,
        required: true,
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt'],
        message: 'The language must be one of the following: en, es, fr, de, it, pt.'
    },
    totalPages: {
        type: Number,
        required: true,
        min: [1, 'The number of pages must be greater than 0.']
    },
    categories: {
        type: [String],
        required: true,
        validate: {
            validator: function(value) {
                return value.length > 0;
            },
            message: 'The book must have at least one category.'
        }
    },
    downloadCount: {
        type: Number,
        default: 0,
        min: [0, 'The download count cannot be negative.'],
    },
    totalRating: {
        type: Number,
        default: 0,
        min: [0, 'The total rating cannot be less than 0.'],
        max: [5, 'The total rating cannot be greater than 5.'],
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: [0, 'The number of reviews cannot be negative.'],
    },
    inReadingLists: {
        type: Number,
        default: 0,
        min: [0, 'The number of reading lists cannot be negative.'],
    },
    formats: {
        type: [String],
        required: true,
        enum: ['PDF', 'EPUB'],
        message: 'The format must be one of the following: PDF, EPUB'
    }
});

bookSchema.pre('save', function(next) {
    if(this.isNew){
        if (this.downloadCount !== 0 || 
            this.totalRating !== 0 || 
            this.totalReviews !== 0 || 
            this.inReadingLists !== 0) {
    
            const err = new Error('The fields downloadCount, totalRating, totalReviews, and inReadingLists should not be included in the request.');
            err.statusCode = 400;
            return next(err);
        }
    }
    next();
});

bookSchema.statics.validateISBNFormat = function (isbn) {
    const isbnRegex = /^(?:\d{9}X|\d{10}|\d{13})$/;
    return isbnRegex.test(isbn);
}
 
bookSchema.index({ isbn: 1 });
const Book = mongoose.model('Book', bookSchema);
module.exports = Book;