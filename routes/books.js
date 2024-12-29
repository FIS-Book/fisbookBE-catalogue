var express = require('express');
var router = express.Router();
var openlibrary = require('../services/openlibraryservice');
var Book = require('../models/book');
const cors = require('cors');

router.get('/healthz', (req, res) => {
    /* 
    #swagger.tags = ['Health']
    #swagger.description = 'Endpoint to check the health status of the service.'
    #swagger.responses[200] = { $ref: '#/responses/ServiceHealthy' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
  res.sendStatus(200);
});

router.get('/isbn/:isbn', cors(), async (req, res) => {
  /* 
    #swagger.tags = ['Books']
    #swagger.description = 'Endpoint to search for a book by its ISBN.'
    #swagger.parameters['isbn'] = { "$ref": "#/parameters/isbnPath" }
    #swagger.responses[200] = { "$ref": "#/responses/BookFound" }
    #swagger.responses[400] = { "$ref": "#/responses/InvalidISBN" }
    #swagger.responses[404] = { "$ref": "#/responses/BookNotFound" }
    #swagger.responses[500] = { "$ref": "#/responses/ServerError" }
  */
  try {
    let { isbn } = req.params;
    isbn = isbn.replace(/[-\s]/g, ''); // Remove any hyphens or spaces

    if (!Book.validateISBNFormat(isbn)) {
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    const book = await Book.findOne({ isbn });

    if (book) {
      return res.json(book);
    }

    return res.status(404).json({ error: 'Book not found' });

  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.get('/', cors(), async (req, res) => {
  /* 
  #swagger.tags = ['Books']
  #swagger.description = 'Endpoint to search for books with optional filters. You can filter by title, author, publication year, category, language, and featured type.'
  #swagger.parameters['title'] = { $ref: '#/parameters/titleQuery' }
  #swagger.parameters['author'] = { $ref: '#/parameters/authorQuery' }
  #swagger.parameters['publicationYear'] = { $ref: '#/parameters/publicationYearQuery' }
  #swagger.parameters['category'] = { $ref: '#/parameters/categoryQuery' }
  #swagger.parameters['language'] = { $ref: '#/parameters/languageQuery' }
  #swagger.parameters['featuredType'] = { $ref: '#/parameters/featuredTypeQuery' }
  #swagger.responses[200] = { $ref: '#/responses/BooksFound' }
  #swagger.responses[400] = { $ref: '#/responses/InvalidQueryParams' }
  #swagger.responses[404] = { $ref: '#/responses/NoBooksFound' }
  #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
      return res.status(404).json({ message: 'No books found for the given search criteria.' });
    }

    res.json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.get('/featured', cors(), async (req, res) => {
  /* 
    #swagger.tags = ['Books'] 
    #swagger.description = 'Endpoint to fetch all featured books, where the featured type is not "none".'
    #swagger.responses[200] = { $ref: '#/responses/BooksFound' }
    #swagger.responses[404] = { $ref: '#/responses/NoFeaturedBooks' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
  try {
    const books = await Book.find({ featuredType: { $ne: 'none' } });
    if (books.length === 0) {
      return res.status(404).json({ message: 'No featured books found.' });
    }
    res.json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.get('/latest', async (req, res) => {
  /* 
    #swagger.tags = ['Books'] 
    #swagger.description = 'Endpoint to fetch the 10 latest books, ordered by publication year in descending order.'
    #swagger.responses[200] = { $ref: '#/responses/BooksFound' }
    #swagger.responses[404] = { $ref: '#/responses/NoBooksFound' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ message: 'Unexpected server error occurred.', error});
  }
});

router.get('/stats', async (req, res) => {
  /* 
    #swagger.tags = ['Books'] 
    #swagger.description = 'Endpoint to fetch statistics about the books collection, including total books, number of authors, most popular genre, and most prolific author.'
    #swagger.responses[200] = { $ref: '#/responses/StatsFetched' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.patch('/:isbn/downloads', async (req, res) => {
  /*
    #swagger.tags = ['Books']
    #swagger.description = 'Endpoint to update the download count for a specific book identified by its ISBN.'
    #swagger.parameters['isbn'] = { $ref: '#/parameters/isbnPath' }
    #swagger.parameters['body'] = {
       name: "downloadCountBody",
       in: 'body',
       description: 'Download count to update for the book.',
       required: true,
       schema: { type: 'object', properties: { downloadCount: { type: 'integer', example: 100 } } }
     }
    #swagger.responses[200] = { $ref: '#/responses/DownloadUpdated' }
    #swagger.responses[400] = { $ref: '#/responses/ValidationError' }
    #swagger.responses[404] = { $ref: '#/responses/BookNotFound' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.patch('/:isbn/readingLists', async (req, res) => {
  /* 
    #swagger.tags = ['Books']
    #swagger.description = 'Update the reading lists count for a book identified by its ISBN.'
    #swagger.parameters['isbn'] = { $ref: '#/parameters/isbnPath' }
    #swagger.parameters['body'] = {
      name: 'readingListsBody',
      in: 'body',
      description: 'Reading lists count to update for the book.',
      required: true,
      schema: { type: 'object', properties: { inReadingLists: { type: 'integer', example: 50 }},},
    },
    #swagger.responses[200] = { $ref: '#/responses/inReadingListsUpdated' }
    #swagger.responses[400] = { $ref: '#/responses/ValidationError' }
    #swagger.responses[404] = { $ref: '#/responses/BookNotFound' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.patch('/:isbn/review', async (req, res) => {
  /* 
    #swagger.tags = ['Books']
    #swagger.description = 'Submit a review and update the total rating and review count.'
    #swagger.parameters['isbn'] = { $ref: '#/parameters/isbnPath' }
    #swagger.parameters['body'] = {
      name: "reviewBody",
      in: "body",
      description: "Review details to be submitted, including the score.",
      required: true,
      schema: {type: "object",properties: {score: { type: "number", example: 4, description: "The score given to the book (0 to 5)." }}
    }
  }
    #swagger.responses[200] = { $ref: '#/responses/ReviewAdded' }
    #swagger.responses[400] = { $ref: '#/responses/ValidationError' }
    #swagger.responses[404] = { $ref: '#/responses/BookNotFound' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
      res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

// ADMIN ENDPOINTS
router.post('/', async (req, res) => {
  /* 
    #swagger.tags = ['Admin']
    #swagger.description = 'Create a new book in the catalog.'
    #swagger.parameters['body'] = {
      name: "bookBody",
      in: "body",
      description: "Book details to create a new book.",
      required: true,
      schema: { $ref: "#/definitions/Book" }
    }
    #swagger.responses[201] = { $ref: '#/responses/BookCreated' }
    #swagger.responses[400] = { $ref: '#/responses/ValidationError' }
    #swagger.responses[409] = { $ref: '#/responses/DuplicateISBN' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }

});

router.delete('/:isbn', async (req, res) => {
  /* 
    #swagger.tags = ['Admin']
    #swagger.description = 'Delete a book from the catalog by ISBN.'
    #swagger.parameters['isbn'] = { $ref: '#/parameters/isbnPath' }
    #swagger.responses[200] = { $ref: '#/responses/BookDeleted' }
    #swagger.responses[400] = { $ref: '#/responses/InvalidISBN' }
    #swagger.responses[404] = { $ref: '#/responses/BookNotFound' }
    #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    res.status(500).json({ message: 'Unexpected server error occurred.', error: error.message });
  }
});

router.put('/:isbn', async (req, res) => {
  /* #swagger.tags = ['Admin']
     #swagger.description = 'Endpoint to update the details of a book by ISBN.'
     #swagger.parameters['isbn'] = { $ref: '#/parameters/isbnPath' }
     #swagger.parameters['body'] = {
       name: 'bookBody',
       in: 'body',
       description: 'Updated details for the book.',
       required: true,
       schema: { $ref: '#/definitions/Book' }
     }
     #swagger.responses[200] = { $ref: '#/responses/BookUpdated' }
     #swagger.responses[400] = { $ref: '#/responses/InvalidISBN' }
     #swagger.responses[404] = { $ref: '#/responses/BookNotFound' }
     #swagger.responses[500] = { $ref: '#/responses/ServerError' }
  */
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
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

module.exports = router;