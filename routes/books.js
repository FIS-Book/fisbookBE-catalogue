var express = require('express');
var router = express.Router();
var openlibrary = require('../services/openlibraryservice');
var Book = require('../models/book');

router.get('/isbn/:isbn', async (req, res) => {
  /*  #swagger.tags = ['Books']
      #swagger.description = 'Endpoint to search for a book by its ISBN.'
  */
  try {
    /* #swagger.parameters['isbn'] = {
      in: 'path',
      description: 'ISBN of the book to search for. Must be in ISBN-10 or ISBN-13 format.',
      required: true,
      type: 'string',
      format: 'isbn'
    } */
    let { isbn } = req.params;
    isbn = isbn.replace(/[-\s]/g, ''); // Remove any hyphens or spaces

    if (!Book.validateISBNFormat(isbn)) {
      /* #swagger.responses[400] = {
        description: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.',
        schema: { type: "object", properties: { error: { type: "string", example: "Invalid ISBN format. Must be ISBN-10 or ISBN-13."}}}
      } */
      return res.status(400).json({ error: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' });
    }

    const book = await Book.findOne({ isbn });

    if (book) {
      /* #swagger.responses[200] = {
          description: 'Book found.',
          schema: { $ref: '#/definitions/Book' }
      } */
      return res.json(book);
    }

    /* #swagger.responses[404] = {
        description: 'Book not found.',
        schema: { type: 'object', properties: { error: { type: 'string', example: 'Book not found' } } }
    } */
    return res.status(404).json({ error: 'Book not found' });

  } catch (error) {
    console.error('Error when searching for book:', error);
    /* #swagger.responses[500] = {
        description: 'Unexpected server error occurred.',
        schema: { type: 'object', properties: { error: { type: 'string', example: 'Unexpected server error occurred.' } } }
    } */
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

router.get('/', async (req, res) => {
  /* #swagger.tags = ['Books']
     #swagger.description = 'Endpoint to search for books with optional filters. You can filter by title, author, publication year, category, language, and featured type.'
  */
  /*
      #swagger.parameters['title'] = {
      in: 'query',
      description: 'Search for books by title.',
      required: false,
      type: 'string',
      example: 'El día que se perdió la cordura'
      }

      #swagger.parameters['author'] = {
        in: 'query',
        description: 'Search for books by author.',
        required: false,
        type: 'string',
        example: 'Javier Castillo'
      }

      #swagger.parameters['publicationYear'] = {
        in: 'query',
        description: 'Search for books by publication year.',
        required: false,
        type: 'integer',
        example: 2015
      }

      #swagger.parameters['category'] = {
        in: 'query',
        description: 'Search for books by category.',
        required: false,
        type: 'string',
        example: 'Fiction'
      }

      #swagger.parameters['language'] = {
        in: 'query',
        description: 'Search for books by language.',
        required: false,
        type: 'string',
        example: 'es'
      }

      #swagger.parameters['featuredType'] = {
        in: 'query',
        description: 'Filter books by featured type (e.g., bestSeller).',
        required: false,
        type: 'string',
        example: 'bestSeller'
      }
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
      /* #swagger.responses[400] = { 
          description: 'Invalid query parameters provided.', 
          schema: { 
            type: 'object', 
            properties: { 
              message: { type: 'string', example: 'Invalid query parameters provided.' }, 
              invalidParameters: { type: 'array', items: { type: 'string' }, example: ['invalidParam1', 'invalidParam2'] } 
            } 
          } 
      } */
      return res.status(400).json({
        message: 'Invalid query parameters provided.',
        invalidParameters: invalidKeys
      });
    }

    const query = Object.keys(req.query)
      .reduce((acc, key) => ({ ...acc, ...filtersMap[key](req.query[key]) }), {});

    const books = await Book.find(query);

    if (books.length === 0) {
      /* #swagger.responses[404] = { 
          description: 'No books found for the given search criteria.', 
          schema: { type: 'object', properties: { message: { type: 'string', example: 'No results found for the given search criteria.' } } } 
      } */
      return res.status(404).json({ message: 'No results found for the given search criteria.' });
    }
    /* #swagger.responses[200] = { 
        description: 'Books found.', 
        schema: { 
          type: 'array', 
          items: { $ref: '#/definitions/Book' } 
        } 
    } */
    res.json(books);
  } catch (error) {
    console.error('Error searching for books:', error);
    /* #swagger.responses[500] = { 
        description: 'Unexpected error while performing search.', 
        schema: { type: 'object', properties: { message: { type: 'string', example: 'Unexpected error while performing search.' }, error: { type: 'string', example: 'Detailed error message here' } } } 
    } */
    return res.status(500).json({ message: 'Unexpected error while performing search.', error });
  }
});

router.get('/featured', async (req, res) => {
  /* #swagger.tags = ['Books'] 
     #swagger.description = 'Endpoint to fetch all featured books, where the featured type is not "none".' 
  */
  try {
    const books = await Book.find({ featuredType: { $ne: 'none' } });

    if (books.length === 0) {
      /* #swagger.responses[404] = { 
          description: 'No featured books found.', 
          schema: { type: 'object', properties: { message: { type: 'string', example: 'No featured books found.' } } } 
      } */
      return res.status(404).json({ message: 'No featured books found.' });
    }
    /* #swagger.responses[200] = { 
        description: 'Featured books found.', 
        schema: { 
          type: 'array', 
          items: { $ref: '#/definitions/Book' } 
        } 
    } */
    res.json(books);
  } catch (error) {
    console.error('Error fetching featured books:', error);
    /* #swagger.responses[500] = { 
        description: 'Unexpected error while fetching featured books.', 
        schema: { type: 'object', properties: { message: { type: 'string', example: 'Unexpected error while fetching featured books.' }, error: { type: 'string', example: 'Detailed error message here' } } } 
    } */
    return res.status(500).json({ message: 'Unexpected error while fetching featured books.', error });
  }
});

router.get('/latest', async (req, res) => {
  /* #swagger.tags = ['Books'] 
     #swagger.description = 'Endpoint to fetch the 10 latest books, ordered by publication year in descending order.' 
  */
  try {
    const latestBooks = await Book.find({})
      .sort({ publicationYear: -1 })
      .limit(10);

    if (latestBooks.length === 0) {
      /* #swagger.responses[404] = { 
          description: 'No books found.', 
          schema: { type: 'object', properties: { message: { type: 'string', example: 'No books found.' } } } 
      } */
      return res.status(404).json({ message: 'No books found.' });
    }
    /* #swagger.responses[200] = { 
        description: 'Latest books found.', 
        schema: { 
          type: 'array', 
          items: { $ref: '#/definitions/Book' } 
        } 
    } */
    res.json(latestBooks);
  } catch (error) {
    console.error('Error fetching latest books:', error);
    /* #swagger.responses[500] = { 
        description: 'Internal server error. Please try again later.', 
        schema: { type: 'object', properties: { message: { type: 'string', example: 'Internal server error. Please try again later.' }, error: { type: 'string', example: 'Detailed error message here' } } } 
    } */
    return res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

router.get('/stats', async (req, res) => {
  /* #swagger.tags = ['Books'] 
     #swagger.description = 'Endpoint to fetch statistics about the books collection, including total books, number of authors, most popular genre, and most prolific author.' 
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
    /* #swagger.responses[200] = {
      description: 'Statistics fetched successfully.',
      schema: { $ref: '#/definitions/Stats' }
    } */
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    /* #swagger.responses[500] = { 
        description: 'Error fetching book stats.', 
        schema: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string', example: 'Error fetching book stats.' }, error: { type: 'string', example: 'Detailed error message here' } } } 
    } */
    return res.status(500).json({ success: false, message: 'Error fetching book stats.', error });
  }
});

router.patch('/:isbn/downloads', async (req, res) => {
  /* #swagger.tags = ['Books']
     #swagger.description = 'Endpoint to update the download count for a specific book identified by its ISBN.'
     #swagger.parameters['isbn'] = {
       in: 'path',
       description: 'ISBN of the book to update the download count.',
       required: true,
       type: 'string',
       example: '9788466346122'
     }
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'Download count to update for the book.',
       required: true,
       schema: {
         type: 'object',
         properties: {
           downloadCount: { type: 'integer', example: 100 }
         }
       }
     }
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
    /* #swagger.responses[200] = {
       description: 'Download count updated successfully.',
       schema: { 
         type: 'object',
         properties: {
           message: { type: 'string', example: 'Book download count updated successfully.' },
           book: { $ref: '#/definitions/Book' }
         }
       }
     } */
    res.json({
      message: 'Book download count updated successfully.',
      book: updatedBook,
    });
  } catch (error) {
    /* #swagger.responses[400] = {
        description: 'Validation failed. Check the provided data.',
        schema: { type: 'object', properties: { error: { type: 'string', example: 'Validation failed. Check the provided data.' }, details: { type: 'object' } } }
      } */
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    console.error('Error updating download count:', error);
    /* #swagger.responses[500] = {
       description: 'Unexpected error while updating download count.',
       schema: { type: 'object', properties: { error: { type: 'string', example: 'Unexpected error while updating download count.' }, details: { type: 'string' } } }
     } */
    return res.status(500).json({
      error: 'Unexpected error while updating download count.',
      details: error.message,
    });
  }
});

router.patch('/:isbn/readingLists', async (req, res) => {
  /* #swagger.tags = ['Books']
     #swagger.description = 'Endpoint to update the total reading lists count for a specific book identified by its ISBN.'
     #swagger.parameters['isbn'] = {
       in: 'path',
       description: 'ISBN of the book to update the reading lists count.',
       required: true,
       type: 'string',
       example: '9788466346122'
     }
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'Reading lists count to update for the book.',
       required: true,
       schema: {
         type: 'object',
         properties: {
           inReadingLists: { type: 'integer', example: 50 }
         }
       }
     }
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
    /* #swagger.responses[200] = {
       description: 'Reading lists count updated successfully.',
       schema: { 
         type: 'object',
         properties: {
           message: { type: 'string', example: 'Book total reading lists updated successfully.' },
           book: { $ref: '#/definitions/Book' }
         }
       }
     } */
    res.json({
      message: 'Book total reading lists updated successfully.',
      book: updatedBook,
    });
  } catch (error) {
    /* #swagger.responses[400] = {
        description: 'Validation failed. Check the provided data.',
        schema: { type: 'object', properties: { error: { type: 'string', example: 'Validation failed. Check the provided data.' }, details: { type: 'object' } } }
      } */
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed. Check the provided data.', details: error.errors });
    }
    console.error('Error updating total reading lists:', error);
    /* #swagger.responses[500] = {
       description: 'Unexpected error while updating total reading lists.',
       schema: { type: 'object', properties: { error: { type: 'string', example: 'Unexpected error while updating total reading lists.' }, details: { type: 'string' } } }
     } */
    return res.status(500).json({
      error: 'Unexpected error while updating total reading lists.',
      details: error.message,
    });
  }
});

// PATCH: Update totalRating and totalReviews
router.patch('/:isbn/review', async (req, res) => {
  /* #swagger.tags = ['Books']
     #swagger.description = 'Endpoint to submit a review for a book. It updates the total rating and review count based on the provided score.'
     #swagger.parameters['isbn'] = {
         in: 'path',
         description: 'ISBN of the book to be reviewed.',
         required: true,
         type: 'string',
         example: '9788466346122'
     }
     #swagger.parameters['body'] = {
         in: 'body',
         description: 'Review details.',
         required: true,
         schema: {
           type: 'object',
           properties: {
             score: { type: 'number', example: 4, description: 'The score given to the book (0 to 5).' }
           }
         }
     }
     #swagger.responses[200] = {
         description: 'Review added successfully, returning the updated rating and review count.',
         schema: {
             message: 'Review added successfully.',
             bookReview: {
                 isbn: '9788466346122',
                 totalRating: 4.5,
                 totalReviews: 10
             }
         }
     }
     #swagger.responses[400] = {
         description: 'Invalid score provided.',
         schema: { message: 'Invalid score. The score must be a number between 0 and 5.' }
     }
     #swagger.responses[404] = {
         description: 'Book not found for the provided ISBN.',
         schema: { message: 'Book not found.' }
     }
     #swagger.responses[500] = {
         description: 'Unexpected error occurred.',
         schema: {
             message: 'An error occurred while updating the review.',
             error: 'Detailed error message'
         }
     }
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
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the review.', error: error.message });
  }
});
router.post('/', async (req, res) => {
  /* #swagger.tags = ['Admin']
     #swagger.description = 'Endpoint to create a new book in the catalog.'
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'Book details to create a new book.',
       required: true,
       schema: { $ref: '#/definitions/Book' }
     }
     #swagger.responses[201] = {
       description: 'Book created successfully.',
       schema: { $ref: '#/definitions/Book' }
     }
     #swagger.responses[400] = {
       description: 'Validation error. Invalid input data.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Validation failed. Check the provided data.' },
           details: { type: 'object', example: { "isbn": "Invalid ISBN format" } }
         }
       }
     }
     #swagger.responses[409] = {
       description: 'Conflict error. Duplicate ISBN.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Duplicate ISBN: a book with this ISBN already exists.' }
         }
       }
     }
     #swagger.responses[500] = {
       description: 'Unexpected server error.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Unexpected server error occurred.' }
         }
       }
     }
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
    console.error('Error creating book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }

});

// DELETE
router.delete('/:isbn', async (req, res) => {
  /* #swagger.tags = ['Admin']
     #swagger.description = 'Endpoint to delete a book from the catalog by ISBN.'
     #swagger.parameters['isbn'] = {
       in: 'path',
       description: 'ISBN of the book to be deleted.',
       required: true,
       type: 'string',
       example: '9788466346122'
     }
     #swagger.responses[200] = {
       description: 'Book deleted successfully.',
       schema: { 
         type: 'object',
         properties: {
           message: { type: 'string', example: 'Book deleted successfully' }
         }
       }
     }
     #swagger.responses[400] = {
       description: 'Invalid ISBN format.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Invalid ISBN format. Must be ISBN-10 or ISBN-13.' }
         }
       }
     }
     #swagger.responses[404] = {
       description: 'Book not found for deletion.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Book not found for deletion.' }
         }
       }
     }
     #swagger.responses[500] = {
       description: 'Unexpected server error.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Unexpected server error occurred.' }
         }
       }
     }
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
    console.error('Error deleting book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

//PUT
router.put('/:isbn', async (req, res) => {
  /* #swagger.tags = ['Admin']
     #swagger.description = 'Endpoint to update the details of a book by ISBN.'
     #swagger.parameters['isbn'] = {
       in: 'path',
       description: 'ISBN of the book to be updated.',
       required: true,
       type: 'string',
       example: '9788466346122'
     }
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'Updated details for the book.',
       required: true,
       schema: { $ref: '#/definitions/Book' }
     }
     #swagger.responses[200] = {
       description: 'Book updated successfully.',
       schema: { $ref: '#/definitions/Book' }
     }
     #swagger.responses[400] = {
       description: 'Invalid ISBN format or validation error.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Invalid ISBN format or validation error.' }
         }
       }
     }
     #swagger.responses[404] = {
       description: 'Book not found for updating.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Book not found for updating.' }
         }
       }
     }
     #swagger.responses[500] = {
       description: 'Unexpected server error.',
       schema: { 
         type: 'object',
         properties: {
           error: { type: 'string', example: 'Unexpected server error occurred.' }
         }
       }
     }
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
    console.error('Error updating book:', error);
    return res.status(500).json({ error: 'Unexpected server error occurred.' });
  }
});

module.exports = router;