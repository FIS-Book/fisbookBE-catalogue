const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Book Catalogue API',
    description: 'This API handles operations related to books in the catalog.',
  },
  host: `${new URL(process.env.BASE_URL).host}`,
  schemes: ['http','https'],
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
    },
    {
      "name": "Health",
      "description": "Endpoints for service health monitoring"
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
  parameters: {
    // Parameters path
    isbnPath: {
      name: "isbn",
      in: "path",
      description: "ISBN of the book. Must be in ISBN-10 or ISBN-13 format.",
      required: true,
      type: "string",
      format: "isbn"
    },
    // Parameters query
    titleQuery: {
      name: "title",
      in: "query",
      required: false,
      type: "string",
      example: "El día que se perdió la cordura"
    },
    authorQuery: {
      name: "author",
      in: "query",
      required: false,
      type: "string",
      example: "Javier Castillo"
    },
    publicationYearQuery: {
      name: "publicationYear",
      in: "query",
      required: false,
      type: "integer",
      example: 2015
    },
    categoryQuery: {
      name: "category",
      in: "query",
      required: false,
      type: "string",
      example: "Fiction"
    },
    languageQuery: {
      name: "language",
      in: "query",
      required: false,
      type: "string",
      example: "es"
    },
    featuredTypeQuery: {
      name: "featuredType",
      in: "query",
      required: false,
      type: "string",
      example: "bestSeller"
    }
  },
  responses: {
    ServiceHealthy: {
      description: "Service is healthy.",
      schema: {
        type: "string",
        example: "OK"
      }
    },
    BookFound: {
      description: "Book found.",
      schema: {
        "$ref": "#/definitions/Book"
      }
    },
    BooksFound: {
      description: "Books found.",
      schema: {
        type: "array",
        items: { $ref: "#/definitions/Book" }
      }
    },
    BookNotFound: {
      description: "Book not found.",
      schema: {
        type: "object",
        properties: {
          error: { type: "string", example: "Book not found" }
        }
      }
    },
    StatsFetched: {
      description: "Statistics fetched successfully.",
      schema: { $ref: "#/definitions/Stats" }
    },
    DownloadUpdated: {
      description: "Download count updated successfully.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Book download count updated successfully." },
          updatedBook: { $ref: "#/definitions/Book" }
        }
      }
    },
    inReadingListsUpdated: {
      description: 'Reading lists count updated successfully.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Book total reading lists updated successfully.' },
          book: { $ref: '#/definitions/Book' },
        },
      },
    },
    ReviewAdded: {
      description: "Review added successfully, returning the updated rating and review count.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Review added successfully." },
          bookReview: {
            type: "object",
            properties: {
              isbn: { type: "string", example: "9788466346122" },
              totalRating: { type: "number", example: 4.5 },
              totalReviews: { type: "integer", example: 10 }
            }
          }
        }
      }
    },
    BookCreated: {
      description: "Book created successfully.",
      schema: { $ref: "#/definitions/Book" }
    },
    BookDeleted: {
      description: "Book deleted successfully.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Book deleted successfully" }
        }
      }
    },
    BookUpdated: {
      description: 'Book updated successfully.',
      schema: { $ref: '#/definitions/Book' }
    },
    NoBooksFound: {
      description: "No books found for the given search criteria.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "No books found for the given search criteria." }
        }
      }
    },
    NoFeaturedBooks: {
      description: "No featured books found.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "No featured books found." }
        }
      }
    },
    InvalidISBN: {
      description: "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
      schema: {
        type: "object",
        properties: {
          error: { type: "string", example: "Invalid ISBN format. Must be ISBN-10 or ISBN-13." }
        }
      }
    },
    DuplicateISBN: {
      description: "Conflict error. Duplicate ISBN.",
      schema: {
        type: "object",
        properties: {
          error: { type: "string", example: "Duplicate ISBN: a book with this ISBN already exists." }
        }
      }
    },
    InvalidQueryParams: {
      description: "Invalid query parameters provided.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Invalid query parameters provided." },
          invalidParameters: {
            type: "array",
            items: { type: "string" },
            example: ["invalidParam1", "invalidParam2"]
          }
        }
      }
    },
    ValidationError: {
      description: "Validation failed. Check the provided data.",
      schema: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed. Check the provided data." },
          details: { type: "object", example: { isbn: "Invalid ISBN format" } }
        }
      }
    },
    ServerError: {
      description: "Unexpected server error occurred.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Unexpected server error occurred." },
          error: { type: "string", example: "InternalServerError: database connection failed." }
        }
      }
    }
  },
  definitions: {
    Book: {
      type: "object",
      required: ["isbn", "title", "author", "publicationYear", "description", "language", "totalPages", "categories", "featuredType", "downloadCount", "totalRating", "totalReviews", "inReadingLists"],
      properties: {
        isbn: { type: "string", example: "9788466346122" },
        title: { type: "string", example: "El día que se perdió la cordura" },
        author: { type: "string", example: "Javier Castillo" },
        publicationYear: { type: "integer", example: 2015 },
        description: { type: "string", example: "Centro de Boston, 24 de diciembre, un hombre camina desnudo con la cabeza decapitada de una joven..." },
        language: { type: "string", example: "es" },
        totalPages: { type: "integer", example: 456 },
        categories: { type: "array", items: { type: "string", example: "Fiction" } },
        featuredType: { type: "string", example: "bestSeller" },
        downloadCount: { type: "integer", example: 0 },
        totalRating: { type: "integer", example: 0 },
        totalReviews: { type: "integer", example: 0 },
        inReadingLists: { type: "integer", example: 0 },
        coverImage: { type: "string", example: "https://covers.openlibrary.org/b/isbn/9788466346122-L.jpg" }
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
  }
};

const outputFile = './swagger-output.json';
const routes = ['../app.js'];

swaggerAutogen(outputFile, routes, doc);
