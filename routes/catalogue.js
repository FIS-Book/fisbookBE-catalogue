var express = require('express');
var router = express.Router();

const books = [{
  isbn: '978-3-16-148410-0',
  title: 'Harry Potter and the Philosopher\'s Stone',
  author: 'J.K. Rowling',
  description: 'The first book in the Harry Potter series...',
  language: 'English',
  totalPages: 300,
  categories: ['Fantasy', 'Adventure'],
  downloadCount: 15000,
  reviews: [
    { userId: 'user1', comment: 'Amazing book!', rating: 5 },
    { userId: 'user2', comment: 'Loved it!', rating: 4.5 }
  ],
  totalRating: 4.8,
  totalReviews: 1500,
  inReadingLists: 300,
  formats: ['pdf', 'epub']
},
{
  isbn: '978-1-56619-909-4',
  title: 'Harry Potter and the Chamber of Secrets',
  author: 'J.K. Rowling',
  description: 'The second book in the Harry Potter series...',
  language: 'English',
  totalPages: 350,
  categories: ['Fantasy', 'Adventure'],
  downloadCount: 12000,
  reviews: [
    { userId: 'user3', comment: 'Great sequel!', rating: 4.7 }
  ],
  totalRating: 4.7,
  totalReviews: 1000,
  inReadingLists: 250,
  formats: ['epub', 'audio']
},
{
  isbn: '978-0-7432-7356-5',
  title: 'The Da Vinci Code',
  author: 'Dan Brown',
  description: 'A mystery thriller involving art, religion, and history...',
  language: 'English',
  totalPages: 500,
  categories: ['Mystery', 'Thriller'],
  downloadCount: 18000,
  reviews: [
    { userId: 'user4', comment: 'Intriguing plot!', rating: 4.9 }
  ],
  totalRating: 4.9,
  totalReviews: 1800,
  inReadingLists: 450,
  formats: ['pdf', 'epub', 'audio']
}
];

/* GET Book Search Method. */
router.get('/', function (req, res, next) {
  try {
    let filteredBooks = [...books];
    const filters = {
      title: (value) => book => book.title && book.title.toLowerCase().includes(value.toLowerCase()),
      author: (value) => book => book.author && book.author.toLowerCase().includes(value.toLowerCase()),
      category: (value) => book => book.categories && book.categories.includes(value),
      language: (value) => book => book.language && book.language.toLowerCase() === value.toLowerCase(),
      format: (value) => book => book.formats && book.formats.includes(value)
    };

    Object.keys(filters).forEach(key => {
      if (req.query[key]) {
        filteredBooks = filteredBooks.filter(filters[key](req.query[key]));
      }
    });

    if (filteredBooks.length === 0) {
      return res.status(404).json({ message: 'No books found with the given search criteria.' });
    }

    res.status(200).json(filteredBooks);
  } catch (error) {
    console.error('Error searching for books:', error);
    res.status(500).json({ message: 'There was an error performing the search.' });
  }
});

module.exports = router;
