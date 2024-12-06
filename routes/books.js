var express = require('express');
var router = express.Router();
var openlibrary = require('../services/openlibraryservice');
var Book = require('../models/book');


/* GET a book by isbn */
router.get('/isbn/:isbn', async (req, res) => {
  try {
    let { isbn } = req.params;
    isbn = isbn.replace(/[-\s]/g, '');

    if (!Book.validateISBNFormat(isbn)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    const book = await Book.findOne({ isbn });

    if (book) {
      return res.json(book);
    }
    return res.status(404).json({ error: 'Book not found' });

  } catch (error) {
    console.error('Error when searching for book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});


/* GET Book Search Method */
router.get('/', async (req, res) => {
  try {
    const filtersMap = {
      title: (value) => ({ title: { $regex: value, $options: 'i' } }),
      author: (value) => ({ author: { $regex: value, $options: 'i' } }),
      publicationYear: (value) => ({ publicationYear: parseInt(value, 10) }),
      category: (value) => ({ categories: value }),
      language: (value) => ({ language: { $regex: `^${value}$`, $options: 'i' } }),
      featuredType: (value) => ({ featuredType: value })
    };

    const validKeys = Object.keys(filtersMap);
    const invalidKeys = Object.keys(req.query).filter((key) => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        message: 'Invalid query parameters provided.',
        invalidParameters: invalidKeys
      });
    }

    const query = Object.keys(req.query)
      .reduce((acc, key) => ({ ...acc, ...filtersMap[key](req.query[key]) }), {});

    const books = await Book.find(query);

    if (books.length === 0) {
      return res.status(404).json({ message: 'No results found for the given search criteria.' });
    }

    res.json(books);
  } catch (error) {
    console.error('Error searching for books:', error);
    return res.status(500).json({ message: 'Unexpected error while performing search.', error });
  }
});


/* GET Recommended Books Method*/
router.get('/featured', async (req, res) => {
  try {
    const books = await Book.find({ featuredType: { $ne: 'none' } });

    if (books.length === 0) {
      return res.status(404).json({ message: 'No featured books found.' });
    }

    res.json(books);
  } catch (error) {
    console.error('Error fetching featured books:', error);
    return res.status(500).json({ message: 'Unexpected error while fetching featured books.', error });

  }
});


/* GET Latest Published Books Method */
router.get('/latest', async (req, res) => {
  try {
    const latestBooks = await Book.find({})
      .sort({ publicationYear: -1 })
      .limit(10);

    if (latestBooks.length === 0) {
      return res.status(404).json({ message: 'No books found.' });
    }

    res.json(latestBooks);
  } catch (error) {
    console.error('Error fetching latest books:', error);
    return res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});


/* GET Statistics From Books Method */
router.get('/stats', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const authors = await Book.distinct('author');
    const mostPopularGenre = await Book.aggregate([
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const mostProlificAuthor = await Book.aggregate([
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);


    const stats = {
      totalBooks,
      authors: authors.length,
      mostPopularGenre: mostPopularGenre.length ? mostPopularGenre[0]._id : null,
      mostProlificAuthor: mostProlificAuthor.length ? mostProlificAuthor[0]._id : null,
    };


    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ success: false, message: 'Error fetching book stats.', error });
  }
});


/* PATCH Download Count Method */
router.patch('/:isbn/downloads', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { downloadCount } = req.body;
    const normalizedISBN = isbn.replace(/[-\s]/g, '');

    if (!Book.validateISBNFormat(normalizedISBN)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    if (typeof downloadCount === 'undefined') {
      return res.status(400).json({ error: "'downloadCount' is required." });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { isbn: normalizedISBN },
      { $set: { downloadCount } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    res.json({
      message: 'Book download count updated successfully.',
      book: updatedBook,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    console.error('Error updating download count:', error);
    return res.status(500).json({
      error: 'Unexpected error while updating download count.',
      details: error.message,
    });
  }
});


/* PATCH Total Reading Lists Method */
router.patch('/:isbn/readingLists', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { inReadingLists } = req.body;
    const normalizedISBN = isbn.replace(/[-\s]/g, '');

    if (!Book.validateISBNFormat(normalizedISBN)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    if (typeof inReadingLists === 'undefined') {
      return res.status(400).json({ error: "'inReadingLists' is required." });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { isbn: normalizedISBN },
      { $set: { inReadingLists } },
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    res.json({
      message: 'Book total reading lists updated successfully.',
      book: updatedBook,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    console.error('Error updating total reading lists:', error);
    return res.status(500).json({
      error: 'Unexpected error while updating total reading lists.',
      details: error.message,
    });
  }
});

// PATCH: Update totalRating and totalReviews
router.patch('/:isbn/review', async (req, res) => {
  const { isbn } = req.params;
  const { score } = req.body;

  if (typeof score !== 'number' || score < 0 || score > 5) {
      return res.status(400).json({ message: 'Invalid score. The score must be a number between 0 and 5.' });
  }

  try {
      const book = await Book.findOne({ isbn });
      if (!book) {
          return res.status(404).json({ message: 'Book not found.' });
      }

    const updatedTotalReviews = book.totalReviews + 1;
    const updatedTotalRating = ((book.totalRating * book.totalReviews) + score) / updatedTotalReviews;

    book.totalReviews = updatedTotalReviews;
    book.totalRating = updatedTotalRating;
      await book.save();

      res.status(200).json({
          message: 'Review added successfully.',
          bookReview: {
              isbn: book.isbn,
              totalRating: book.totalRating,
              totalReviews: book.totalReviews,
          }
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the review.', error: error.message });
  }
});

// Admin methods
// POST
router.post('/', async (req, res) => {

  try {
    const coverImage = await openlibrary.getCoverUrl(req.body.isbn);
    const book = new Book({
      ...req.body,
      "coverImage": coverImage
    });
    await book.save();
    return res.status(201).json({ message: 'Book created successfully', book });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate ISBN: a book with this ISBN already exists.' });
    }
    console.error('Error creating book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }

});

// DELETE
router.delete('/:isbn', async (req, res) => {
  try {
    let { isbn } = req.params;
    isbn = isbn.replace(/[-\s]/g, '');

    if (!Book.validateISBNFormat(isbn)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    const book = await Book.findOneAndDelete({ isbn });

    if (!book) {
      return res.status(404).json({ error: 'Book not found for deletion.' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

//PUT
router.put('/:isbn', async (req, res) => {
  try {
    let { isbn } = req.params;
    isbn = isbn.replace(/[-\s]/g, '');

    if (!Book.validateISBNFormat(isbn)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    const book = await Book.findOneAndUpdate(
      { isbn },
      { ...req.body },
      {
        // Returns the updated document instead of the original.
        new: true,
        // Runs validation checks defined in the schema before saving the data.
        runValidators: true
      }
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found for updating.' });
    }

    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

module.exports = router;
