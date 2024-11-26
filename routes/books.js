var express = require('express');
var router = express.Router();
var Book = require('../models/book');


/* GET a book by isbn */
router.get('/:isbn', async(req, res) => {
  let { isbn } = req.params;

  isbn = isbn.replace(/[-\s]/g, '');
  console.log(`Searching for ISBN: ${isbn}`);

  if (!Book.validateISBNFormat(isbn)) {
    return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
  }

  try {
    const book = await Book.findOne({isbn});
    console.log(book);

    if (book) {
      res.json(book); 
    } else {
      res.status(404).json({ error: 'Book Not Found' });
    }
  } catch (error) {
    console.error('Error when searching for book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
      format: (value) => ({ formats: value })
    };

    const validKeys = Object.keys(filtersMap);
    const invalidKeys = Object.keys(req.query).filter((key) => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        message: 'Bad Request: Invalid query parameters provided.',
        invalidParameters: invalidKeys
      });
    }

    const query = Object.keys(req.query)
      .reduce((acc, key) => ({ ...acc, ...filtersMap[key](req.query[key]) }), {});

    const books = await Book.find(query);

    if (books.length === 0) {
      return res.status(404).json({ message: 'No books found with the given search criteria.' });
    }

    res.status(200).json(books);
  } catch (error) {
    console.error('Error searching for books:', error);
    res.status(500).json({ message: 'There was an error performing the search.', error });
  }
});

module.exports = router;
