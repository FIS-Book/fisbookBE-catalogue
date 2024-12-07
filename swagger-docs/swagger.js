const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Book Catalogue API',
    description: 'This API handles operations related to books in the catalog.',
  },
  host: "localhost:3000",
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      "name": "Books",
      "description": "Endpoints for managing books in the library"
    },
    {
      "name": "Admin",
      "description": "Admin endpoints"
    }
  ],
  // securityDefinitions: {
  //   apiKeyAuth: {
  //     type: "apiKey",
  //     in: "header",  // "header", "query" o "cookie"
  //     name: "X-API-KEY",
  //     description: "Authentication header for API access"
  //   }
  // },
  definitions: {
    Book: {
      type: "object",
      required: ["isbn", "title", "author", "publicationYear", "description", "language", "totalPages", "categories", "featuredType", "downloadCount", "totalRating", "totalReviews", "inReadingLists"],
      properties: {
        isbn: {
          type: "string",
          example: "9788466346122"
        },
        title: {
          type: "string",
          example: "El día que se perdió la cordura"
        },
        author: {
          type: "string",
          example: "Javier Castillo"
        },
        publicationYear: {
          type: "integer",
          example: 2015
        },
        description: {
          type: "string",
          example: "Centro de Boston, 24 de diciembre, un hombre camina desnudo con la cabeza decapitada de una joven..."
        },
        language: {
          type: "string",
          example: "es"
        },
        totalPages: {
          type: "integer",
          example: 456
        },
        categories: {
          type: "array",
          items: {
            type: "string",
            example: "Fiction"
          }
        },
        featuredType: {
          type: "string",
          example: "bestSeller"
        },
        downloadCount: {
          type: "integer",
          example: 0
        },
        totalRating: {
          type: "integer",
          example: 0
        },
        totalReviews: {
          type: "integer",
          example: 0
        },
        inReadingLists: {
          type: "integer",
          example: 0
        },
        coverImage: {
          type: "string",
          example: "https://covers.openlibrary.org/b/isbn/9788466346122-L.jpg"
        }
      }
    },
    Stats: {
      type: 'object',
      properties: {
        totalBooks: { type: 'number', example: 500 },
        authors: { type: 'number', example: 250 },
        mostPopularGenre: { type: 'string', example: 'Fiction' },
        mostProlificAuthor: { type: 'string', example: 'J.K. Rowling' }
      }
    },
    ErrorResponse: {
      type: "object",
      properties: {
        error: {
          type: "string",
          example: "Book not found"
        }
      }
    }
  }
};

const outputFile = './swagger-output.json';
const routes = ['../app.js'];

swaggerAutogen(outputFile, routes, doc);
