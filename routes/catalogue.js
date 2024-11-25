var express = require('express');
var router = express.Router();


/* Simulate a database */
var books = [
  {
    isbn: "978-3-16-148410-0",
    title: "El arte de programar",
    author: "Juan Pérez",
    description: "Una guía completa para aprender a programar desde cero, con ejemplos prácticos y explicaciones claras.",
    language: "Español",
    numberPages: 350,
    categories: ["Tecnología", "Educación", "Programación"],
    numberDownload: 1500,
    reviews: [
      {
        userId: "user123",
        comment: "Excelente libro para principiantes y expertos.",
        score: 4.5
      },
      {
        userId: "user456",
        comment: "La explicación de los conceptos es muy clara.",
        score: 5.0
      }
    ],
    totalScore: 4.75,
    totalReviews: 2,
    inReadingLists: 120,
    formats: ["pdf", "epub", "audio"],
    seeBox: "https://example.com/visualizar-libro"

  }
]


/* GET a book by isbn */

router.get('/:isbn', (req, res) => {
  var isbn  = req.params.isbn;
  var book = books.find(book => book.isbn === isbn);
  
  if (book) {
    res.status(200).json(book);
  } else {
    res.status(404).json({ error: "Book Not Found" });
  }
});




module.exports = router;