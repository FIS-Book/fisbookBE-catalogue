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


module.exports = router;