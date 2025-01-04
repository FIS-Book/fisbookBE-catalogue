const app = require('../app');
const request = require('supertest');
const Book = require('../models/book');
const openlibrary = require('../services/openlibraryservice');

const createValidationError = (field, message, value, type = "min", constraint = null) => {
    const properties = {
        message,
        type,
        path: field,
        value,
    };

    if (constraint != null) {
        properties[type] = constraint;
    }

    if (value === null) {
        delete properties.value;
    }

    return {
        name: "ValidationError",
        message: "Validation failed. Check the provided data.",
        errors: {
            [field]: {
                name: "ValidatorError",
                message,
                properties,
                kind: type,
                path: field,
                value
            }
        }
    };
};
jest.mock('../authentication/authenticateAndAuthorize', () => {
    return jest.fn(() => (req, res, next) => {
        req.user = {
            _id: '1234567890abcdef12345678',
            nombre: 'Test',
            apellidos: 'User',
            username: 'testuser',
            email: 'test@example.com',
            plan: 'free',
            rol: 'Admin'
          };
        next();
    });
});
describe("Catalogue API", () => {
    
    describe("Admin endpoints", () => {
        describe("POST /api/v1/books", () => {
            const book = {
                isbn: "1234567891",
                title: "New Book",
                author: "New Author",
                publicationYear: 2023,
                description: "New Description New Description New Description New Description New Description New Description New Description New Description New Description New Description",
                language: "es",
                totalPages: 222,
                categories: ['Fiction']
            };
            var dbSave;

            beforeEach(() => {
                jest.clearAllMocks();
                dbSave = jest.spyOn(Book.prototype, "save");
            });

            it("Should add a new book if everything is fine", async () => {
                dbSave.mockImplementation(async () => Promise.resolve());

                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    // Validate response status and message
                    expect(response.statusCode).toBe(201);
                    expect(response.body).toHaveProperty("message", "Book created successfully");

                    // Validate that the book properties are correctly created
                    const createdBook = response.body.book;
                    expect(createdBook).toHaveProperty("isbn", book.isbn);
                    expect(createdBook).toHaveProperty("title", book.title);
                    expect(createdBook).toHaveProperty("author", book.author);
                    expect(createdBook).toHaveProperty("publicationYear", book.publicationYear);
                    expect(createdBook).toHaveProperty("description", book.description);
                    expect(createdBook).toHaveProperty("language", book.language);
                    expect(createdBook).toHaveProperty("totalPages", book.totalPages);
                    expect(createdBook).toHaveProperty("categories");
                    expect(createdBook.categories).toEqual(expect.arrayContaining(book.categories));

                    // Validate that auto-generated fields are set correctly
                    expect(createdBook).toHaveProperty("featuredType", "none");
                    expect(createdBook).toHaveProperty("downloadCount", 0);
                    expect(createdBook).toHaveProperty("totalRating", 0);
                    expect(createdBook).toHaveProperty("totalReviews", 0);
                    expect(createdBook).toHaveProperty("inReadingLists", 0);
                    expect(createdBook).toHaveProperty("coverImage");
                    expect(createdBook.coverImage).toBe(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);  // Assuming this URL is returned
                    expect(createdBook).not.toHaveProperty("_id");
                    expect(createdBook).not.toHaveProperty("__v");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should create a book with null cover image if openlibrary fails to fetch cover", async () => {
                jest.spyOn(openlibrary, "getCoverUrl").mockImplementation(async () => Promise.resolve(null));
                dbSave.mockImplementation(async () => Promise.resolve());

                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    expect(response.statusCode).toBe(201);
                    expect(response.body.book).toHaveProperty('coverImage', null);
                    expect(dbSave).toBeCalled();
                    expect(jest.spyOn(openlibrary, "getCoverUrl")).toBeCalled();
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbSave.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 for invalid JSON format", async () => {
                const invalidJson = '{ "isbn": "1234567891", "title": "Test Book", "author": "Test Author" ';

                return request(app).post('/api/v1/books').set('Content-Type', 'application/json').send(invalidJson).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "Invalid JSON format");
                });
            });

            it("Should return 400 if auto-generated fields are included in the request", async () => {
                const invalidBook = new Book({
                    ...book,
                    downloadCount: 1
                });
                dbSave.mockImplementation(async () => {
                    const error = new Error("The fields downloadCount, totalRating, totalReviews, and inReadingLists should not be included in the request.");
                    error.statusCode = 400;
                    throw error;
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "The fields downloadCount, totalRating, totalReviews, and inReadingLists should not be included in the request.");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 if validation fails (short title)", async () => {
                const invalidBook = { ...book, title: "AB" };
                dbSave.mockImplementation(async () => {
                    throw createValidationError(
                        "title",
                        "The title must be at least 3 characters long.",
                        invalidBook.title,
                        "minlength", 3
                    );
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("title");
                    expect(response.body.details.title).toHaveProperty("message", "The title must be at least 3 characters long.");
                    expect(response.body.details.title).toHaveProperty("value", invalidBook.title);
                    expect(response.body.details.title.properties).toHaveProperty("type", "minlength");
                    expect(response.body.details.title.properties).toHaveProperty("minlength", 3);
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 if the publication year is invalid", async () => {
                const invalidBook = { ...book, publicationYear: 1800 };
                dbSave.mockImplementation(async () => {
                    throw createValidationError(
                        "publicationYear",
                        "The publication year must be greater than or equal to 1900.",
                        invalidBook.publicationYear,
                        "min", 1900
                    );
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("publicationYear");
                    expect(response.body.details.publicationYear).toHaveProperty("message", "The publication year must be greater than or equal to 1900.");
                    expect(response.body.details.publicationYear).toHaveProperty("value", invalidBook.publicationYear);
                    expect(response.body.details.publicationYear.properties).toHaveProperty("type", "min");
                    expect(response.body.details.publicationYear.properties).toHaveProperty("min", 1900);
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 if ISBN format is invalid", async () => {
                const invalidBook = { ...book, isbn: "123" };
                dbSave.mockImplementation(async () => {
                    throw createValidationError(
                        "isbn",
                        "Invalid ISBN format. Must be ISBN-10 or ISBN-13.",
                        invalidBook.isbn,
                        "regexp", "{}"
                    );
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("isbn");
                    expect(response.body.details.isbn).toHaveProperty("message", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
                    expect(response.body.details.isbn).toHaveProperty("value", invalidBook.isbn);
                    expect(response.body.details.isbn.properties).toHaveProperty("type", "regexp");
                    expect(response.body.details.isbn.properties).toHaveProperty("regexp", "{}");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 if a required field is missing", async () => {
                const invalidBook = { ...book };
                delete invalidBook.author;
                dbSave.mockImplementation(async () => {
                    throw createValidationError(
                        "author",
                        "Path `author` is required.",
                        null,
                        "requiered"
                    );
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("author");
                    expect(response.body.details.author).toHaveProperty("message", "Path `author` is required.");
                    expect(response.body.details.author.properties).toHaveProperty("type", "requiered");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 400 if categories array is empty", async () => {
                const invalidBook = { ...book, categories: [] };
                dbSave.mockImplementation(async () => {
                    throw createValidationError(
                        "categories",
                        "The book must have at least one category.",
                        invalidBook.categories,
                        "user defined"
                    );
                });

                return request(app).post(`/api/v1/books`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("categories");
                    expect(response.body.details.categories).toHaveProperty("message", "The book must have at least one category.");
                    expect(response.body.details.categories).toHaveProperty("value", invalidBook.categories);
                    expect(response.body.details.categories.properties).toHaveProperty("type", "user defined");
                    expect(dbSave).toBeCalled();
                });
            });

            it("Should return 409 if the ISBN is already in use", async () => {
                // Mock a duplicate key error
                dbSave.mockImplementation(async () => {
                    const error = new Error("Duplicate key error");
                    error.code = 11000; // MongoDB's duplicate key error code
                    throw error;
                });

                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    expect(response.statusCode).toBe(409);
                    expect(response.body).toHaveProperty("error", "Duplicate ISBN: a book with this ISBN already exists.");
                    expect(dbSave).toBeCalled();
                });
            });

        });
        describe("DELETE /api/v1/books/{isbn}", () => {
            var dbDelete;
            beforeEach(() => {
                jest.clearAllMocks();
                dbDelete = jest.spyOn(Book, 'findOneAndDelete');
            });

            it("Should delete a book if everything is fine", async () => {
                const validIsbn = '9788466346122';
                dbDelete.mockImplementation(async () => Promise.resolve(true));

                return request(app).delete(`/api/v1/books/${validIsbn}`).then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toHaveProperty("message", "Book deleted successfully");
                    expect(dbDelete).toBeCalled();
                });
            });

            it("Should return 404 if the book does not exist", async () => {
                const isbn = '9788466346122';
                dbDelete.mockImplementation(async () => Promise.resolve(null));

                return request(app).delete(`/api/v1/books/${isbn}`).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("message", "Book not found for deletion.");
                    expect(dbDelete).toBeCalled();
                });
            });

            it("Should return 400 if the ISBN format is invalid", async () => {
                const invalidIsbn = '123';

                return request(app).delete(`/api/v1/books/${invalidIsbn}`).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                const isbn = '9788466346122';
                dbDelete.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).delete(`/api/v1/books/${isbn}`).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbDelete).toBeCalled();
                });
            });
        });
        describe("PUT /api/v1/books/{isbn}", () => {
            const validIsbn = '9788466346122';
            const validBook = new Book({
                isbn: '9781234567890',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2021,
                description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                language: 'en',
                totalPages: 200,
                categories: ['Fiction'],
                featuredType: 'none',
                downloadCount: 0,
                totalRating: 0,
                totalReviews: 2,
                inReadingLists: 0,
                coverImage: null
            });
            var dbUpdate;
            beforeEach(() => {
                jest.clearAllMocks();
                dbUpdate = jest.spyOn(Book, 'findOneAndUpdate');
            });

            it("Should update a book if everything is fine", async () => {
                dbUpdate.mockImplementation(async () => Promise.resolve(validBook));

                return request(app).put(`/api/v1/books/${validIsbn}`).send(validBook).then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toHaveProperty("message", "Book updated successfully");
                    expect(response.body).toHaveProperty("book");
                    expect(response.body.book).toHaveProperty("isbn", validBook.isbn);
                    expect(response.body.book).toHaveProperty("title", validBook.title);
                    expect(response.body.book).toHaveProperty("author", validBook.author);
                    expect(response.body.book).toHaveProperty("publicationYear", validBook.publicationYear);
                    expect(response.body.book).toHaveProperty("description", validBook.description);
                    expect(response.body.book).toHaveProperty("language", validBook.language);
                    expect(response.body.book).toHaveProperty("totalPages", validBook.totalPages);
                    expect(response.body.book).toHaveProperty("categories");
                    expect(response.body.book.categories).toEqual(expect.arrayContaining(validBook.categories));
                    expect(response.body.book).toHaveProperty("featuredType", validBook.featuredType);
                    expect(response.body.book).toHaveProperty("downloadCount", validBook.downloadCount);
                    expect(response.body.book).toHaveProperty("totalRating", validBook.totalRating);
                    expect(response.body.book).toHaveProperty("totalReviews", validBook.totalReviews);
                    expect(response.body.book).toHaveProperty("inReadingLists", validBook.inReadingLists);
                    expect(response.body.book).toHaveProperty("coverImage", validBook.coverImage);
                    expect(dbUpdate).toBeCalled();
                });
            });

            it("Should return 404 if the book does not exist", async () => {
                dbUpdate.mockImplementation(async () => Promise.resolve(null));

                return request(app).put(`/api/v1/books/${validIsbn}`).send(validBook).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("message", "Book not found for updating.");
                    expect(dbUpdate).toBeCalled();
                });
            });

            it("Should return 400 if the ISBN format is invalid", async () => {
                const invalidIsbn = '123';

                return request(app).put(`/api/v1/books/${invalidIsbn}`).send(validBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbUpdate.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).put(`/api/v1/books/${validIsbn}`).send(validBook).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbUpdate).toBeCalled();
                });
            });

            it("Should return 400 if validation fails (short title)", async () => {
                const invalidBook = { ...validBook, title: "AB" };
                dbUpdate.mockImplementation(async () => {
                    throw createValidationError(
                        "title",
                        "The title must be at least 3 characters long.",
                        invalidBook.title,
                        "minlength", 3
                    );
                });

                return request(app).put(`/api/v1/books/${validIsbn}`).send(invalidBook).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error");
                    expect(response.body.error).toMatch("Validation failed. Check the provided data.");
                    expect(response.body).toHaveProperty("details");
                    expect(response.body.details).toHaveProperty("title");
                    expect(response.body.details.title).toHaveProperty("message", "The title must be at least 3 characters long.");
                    expect(response.body.details.title).toHaveProperty("value", invalidBook.title);
                    expect(response.body.details.title.properties).toHaveProperty("type", "minlength");
                    expect(response.body.details.title.properties).toHaveProperty("minlength", 3);
                    expect(dbUpdate).toBeCalled();
                });
            });
        });
    });
    describe("Books endpoints", () => {
        describe("GET /api/v1/books/isbn/{isbn}", () => {
            const book = new Book({
                isbn: '9781234567890',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2021,
                description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                language: 'en',
                totalPages: 200,
                categories: ['Fiction'],
                featuredType: 'none',
                downloadCount: 0,
                totalRating: 0,
                totalReviews: 2,
                inReadingLists: 0,
                coverImage: null
            });
            var dbFindOne;
            beforeEach(() => {
                jest.clearAllMocks();
                dbFindOne = jest.spyOn(Book, 'findOne');
            });

            it("Should return all books if everything is fine", async () => {
                dbFindOne.mockImplementation(async () => Promise.resolve(book));

                return request(app).get(`/api/v1/books/isbn/${book.isbn}`).then((response) => {
                    expect(response.statusCode).toBe(200);

                    expect(response.body).toHaveProperty("isbn", book.isbn);
                    expect(response.body).toHaveProperty("title", book.title);
                    expect(response.body).toHaveProperty("author", book.author);
                    expect(response.body).toHaveProperty("publicationYear", book.publicationYear);
                    expect(response.body).toHaveProperty("description", book.description);
                    expect(response.body).toHaveProperty("language", book.language);
                    expect(response.body).toHaveProperty("totalPages", book.totalPages);
                    expect(response.body).toHaveProperty("categories");
                    expect(response.body.categories).toEqual(expect.arrayContaining(book.categories));
                    expect(response.body).toHaveProperty("featuredType", book.featuredType);
                    expect(response.body).toHaveProperty("downloadCount", book.downloadCount);
                    expect(response.body).toHaveProperty("totalRating", book.totalRating);
                    expect(response.body).toHaveProperty("totalReviews", book.totalReviews);
                    expect(response.body).toHaveProperty("inReadingLists", book.inReadingLists);
                    expect(response.body).toHaveProperty("coverImage", book.coverImage);
                    expect(dbFindOne).toBeCalled();
                });
            });

            it("Should return 404 if no books are found", async () => {
                dbFindOne.mockImplementation(async () => Promise.resolve(null));

                return request(app).get(`/api/v1/books/isbn/${book.isbn}`).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("message", "Book not found");
                    expect(dbFindOne).toBeCalled();
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbFindOne.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).get(`/api/v1/books/isbn/${book.isbn}`).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbFindOne).toBeCalled();
                });
            });

            it("Should return 400 if the ISBN format is invalid", async () => {
                const invalidIsbn = '123';

                return request(app).get(`/api/v1/books/isbn/${invalidIsbn}`).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
                });
            });
        });
        describe("GET /api/v1/books", () => {
            const books = [
                {
                    isbn: '9781234567890',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2021,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'Bestseller',
                    downloadCount: 10,
                    totalRating: 2,
                    totalReviews: 2,
                    inReadingLists: 1,
                    coverImage: "https://covers.openlibrary.org/b/isbn/9781234567890-L.jpg"
                },
                {
                    isbn: '1234567891',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2021,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'none',
                    downloadCount: 0,
                    totalRating: 0,
                    totalReviews: 2,
                    inReadingLists: 0,
                    coverImage: "https://covers.openlibrary.org/b/isbn/1234567891-L.jpg"
                }];
            var dbFind;
            beforeEach(() => {
                jest.clearAllMocks();
                dbFind = jest.spyOn(Book, 'find');
            });

            it("Should return books if filters are applied correctly", async () => {
                dbFind.mockImplementation(async () => Promise.resolve(books));

                return request(app).get('/api/v1/books?title=Book&author=Author').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual(expect.arrayContaining(books));
                    expect(dbFind).toBeCalled();
                });
            });

            it("Should return 404 if no books are found", async () => {
                dbFind.mockImplementation(async () => Promise.resolve([]));

                return request(app).get('/api/v1/books?title=Book&author=Author').then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toEqual({ message: "No books found for the given search criteria." }); // Ajustado para igualar la respuesta actual
                    expect(dbFind).toBeCalled();
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbFind.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).get('/api/v1/books?title=Book&author=Author').then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbFind).toBeCalled();
                });
            });

            it("Should return 400 if query parameters are invalid", async () => {
                return request(app).get('/api/v1/books?invalidparam=Bo').then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("message", "Invalid query parameters provided.");
                    expect(response.body).toHaveProperty("invalidParameters");
                    expect(response.body.invalidParameters).toEqual(expect.arrayContaining(["invalidparam"]));
                });
            });

            it("Should return 200 and a list of books when all query parameters are provided", async () => {
                dbFind.mockImplementation(async () => Promise.resolve(books[0]));

                return request(app).get('/api/v1/books?title=Book&author=Author&publicationYear=2021&language=en&category=Fiction&featuredType=Bestseller').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual(books[0]);
                    expect(dbFind).toBeCalled();
                });
            });

        });
        describe("GET /api/v1/books/featured", () => {
            const books = [
                {
                    isbn: '9781234567890',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2021,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'Bestseller',
                    downloadCount: 10,
                    totalRating: 2,
                    totalReviews: 2,
                    inReadingLists: 1,
                    coverImage: "https://covers.openlibrary.org/b/isbn/9781234567890-L.jpg"
                },
                {
                    isbn: '1234567891',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2021,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'awardWinner',
                    downloadCount: 0,
                    totalRating: 0,
                    totalReviews: 2,
                    inReadingLists: 0,
                    coverImage: "https://covers.openlibrary.org/b/isbn/1234567891-L.jpg"
                }];
            var dbFind;
            beforeEach(() => {
                jest.clearAllMocks();
                dbFind = jest.spyOn(Book, 'find');
            });

            it("Should return 200 and a list of featured books", async () => {
                dbFind.mockImplementation(async () => Promise.resolve(books));

                return request(app).get('/api/v1/books/featured').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual(books);
                    expect(dbFind).toBeCalledWith({ featuredType: { $ne: 'none' } });
                });
            });

            it("Should return 404 if no featured books are found", async () => {
                dbFind.mockImplementation(async () => Promise.resolve([]));

                return request(app).get('/api/v1/books/featured').then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toEqual({ message: "No featured books found." });
                    expect(dbFind).toBeCalledWith({ featuredType: { $ne: 'none' } });
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbFind.mockImplementation(async () => Promise.reject(new Error("Unexpected server error occurred.")));

                return request(app).get('/api/v1/books/featured').then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                    expect(dbFind).toBeCalledWith({ featuredType: { $ne: 'none' } });
                });
            });
        });
        describe("GET /api/v1/books/latest", () => {
            const books = [
                {
                    isbn: '9781234567890',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2024,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'Bestseller',
                    downloadCount: 10,
                    totalRating: 2,
                    totalReviews: 2,
                    inReadingLists: 1,
                    coverImage: "https://covers.openlibrary.org/b/isbn/9781234567890-L.jpg"
                },
                {
                    isbn: '1234567891',
                    title: 'Test Book',
                    author: 'Test Author',
                    publicationYear: 2024,
                    description: 'A test book description that is exactly one hundred and twenty characters long for testing.',
                    language: 'en',
                    totalPages: 200,
                    categories: ['Fiction'],
                    featuredType: 'awardWinner',
                    downloadCount: 0,
                    totalRating: 0,
                    totalReviews: 2,
                    inReadingLists: 0,
                    coverImage: "https://covers.openlibrary.org/b/isbn/1234567891-L.jpg"
                }];
            var dbFind;
            beforeEach(() => {
                jest.clearAllMocks();
                dbFind = jest.spyOn(Book, 'find');
            });

            it("Should return 200 and a list of lastest books", async () => {
                dbFind.mockReturnValue({
                    sort: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue(books),
                });

                return request(app).get('/api/v1/books/latest').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual(books);
                    expect(dbFind).toBeCalled();
                });
            });

            it("Should return 404 if no latest books are found", async () => {
                dbFind.mockReturnValue({
                    sort: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue([]), // Devuelve los libros después de aplicar sort y limit
                });

                return request(app).get('/api/v1/books/latest').then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toEqual({ message: 'No books found.' });
                    expect(dbFind).toBeCalled();
                });
            });
        });
        describe("GET /api/v1/books/stats", () => {
            const stats = {
                totalBooks: 5,
                authors: 3,
                mostPopularGenre: 'Fiction',
                mostProlificAuthor: 'Test Author',
            };
            beforeEach(() => {
                jest.clearAllMocks();
            });

            it("Should return 200 and stats data", async () => {
                jest.spyOn(Book, 'countDocuments').mockResolvedValue(5);
                jest.spyOn(Book, 'distinct').mockResolvedValue(['Author1', 'Author2', 'Test Author']);
                jest.spyOn(Book, 'aggregate').mockResolvedValueOnce([{ _id: 'Fiction', count: 3 }]);
                jest.spyOn(Book, 'aggregate').mockResolvedValueOnce([{ _id: 'Test Author', count: 2 }]);


                return request(app).get('/api/v1/books/stats').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual({
                        success: true,
                        data: stats,
                    });
                });
            });

            it("Should return 500 if there's a server error", async () => {
                // Simulamos un error en el proceso de agregación.
                jest.spyOn(Book, 'countDocuments').mockRejectedValueOnce(new Error('Database error'));

                return request(app).get('/api/v1/books/stats').then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toEqual({
                        message: 'Unexpected server error occurred.',
                        error: 'Database error',
                    });
                });
            });

            it("Should handle empty results (no books in the collection)", async () => {
                // Simulamos que no hay libros en la colección.
                jest.spyOn(Book, 'countDocuments').mockResolvedValue(0); // Total books = 0
                jest.spyOn(Book, 'distinct').mockResolvedValue([]); // No authors
                jest.spyOn(Book, 'aggregate').mockResolvedValue([]); // No genres or authors

                return request(app).get('/api/v1/books/stats').then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toEqual({
                        success: true,
                        data: {
                            totalBooks: 0,
                            authors: 0,
                            mostPopularGenre: null,
                            mostProlificAuthor: null,
                        },
                    });
                });
            });
        });
        describe("PATCH /api/v1/books/:isbn/downloads", () => {
            let dbfindOneUpdate;

            beforeEach(() => {
                jest.clearAllMocks();
                dbfindOneUpdate = jest.spyOn(Book, 'findOneAndUpdate');
            });

            it("Should return 200 and update the download count successfully", async () => {
                const isbn = '1234567891';
                const downloadCount = 100;
                const updatedBook = {
                    isbn,
                    title: 'Test Book',
                    downloadCount
                };

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(updatedBook));

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({ downloadCount }).then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body.message).toBe('Book download count updated successfully.');
                    expect(response.body.book.downloadCount).toBe(downloadCount);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 400 if ISBN format is invalid", async () => {
                const invalidIsbn = 'invalid-isbn';
                const downloadCount = 100;

                return request(app).patch(`/api/v1/books/${invalidIsbn}/downloads`).send({ downloadCount }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe('Invalid ISBN format. Must be ISBN-10 or ISBN-13.');
                });
            });

            it("Should return 400 if downloadCount is not provided", async () => {
                const isbn = '9781234567890';

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({}).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("'downloadCount' is required.");
                });
            });

            it("Should return 400 if downloadCount is not a number", async () => {
                const isbn = '9781234567890';
                const invalidDownloadCount = "not-a-number";

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({ downloadCount: invalidDownloadCount }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("'downloadCount' must be a valid number.");
                });
            });

            it("Should return 400 if downloadCount is less than 0", async () => {
                const isbn = '9781234567890';
                const downloadCount = -10;
                dbfindOneUpdate.mockImplementation(async () => {
                    throw createValidationError(
                        "downloadCount",
                        "The download count cannot be negative.",
                        downloadCount,
                        "min", 0
                    );
                });

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({ downloadCount }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("Validation failed. Check the provided data.");
                    expect(response.body.details).toHaveProperty("downloadCount");
                    expect(response.body.details.downloadCount).toHaveProperty("message", "The download count cannot be negative.");
                    expect(response.body.details.downloadCount).toHaveProperty("value", downloadCount);
                    expect(response.body.details.downloadCount.properties).toHaveProperty("type", "min");
                    expect(response.body.details.downloadCount.properties).toHaveProperty("min", 0);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 404 if book is not found", async () => {
                const isbn = '9781234567890';
                const downloadCount = 100;

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(null));

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({ downloadCount }).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body.message).toBe('Book not found.');
                });
            });

            it("Should return 500 if an unexpected error occurs", async () => {
                const isbn = '9781234567890';
                const downloadCount = 100;

                dbfindOneUpdate.mockImplementation(async () => Promise.reject(new Error('Unexpected error')));

                return request(app).patch(`/api/v1/books/${isbn}/downloads`).send({ downloadCount }).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body.message).toBe('Unexpected server error occurred.');
                    expect(response.body.error).toBe('Unexpected error');
                });                
            });
        });
        describe("PATCH /api/v1/books/:isbn/readingsLists", () => {
            let dbfindOneUpdate;

            beforeEach(() => {
                jest.clearAllMocks();
                dbfindOneUpdate = jest.spyOn(Book, 'findOneAndUpdate');
            });

            it("Should return 200 and update the inReadingLists count successfully", async () => {
                const isbn = '1234567891';
                const inReadingLists = 100;
                const updatedBook = {
                    isbn,
                    title: 'Test Book',
                    inReadingLists
                };

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(updatedBook));

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({ inReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body.message).toBe('Book total reading lists updated successfully.');
                    expect(response.body.book.inReadingLists).toBe(inReadingLists);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 400 if ISBN format is invalid", async () => {
                const invalidIsbn = 'invalid-isbn';
                const inReadingLists = 100;

                return request(app).patch(`/api/v1/books/${invalidIsbn}/readingLists`).send({ inReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe('Invalid ISBN format. Must be ISBN-10 or ISBN-13.');
                });
            });

            it("Should return 400 if inReadingLists is not provided", async () => {
                const isbn = '9781234567890';

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({}).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("'inReadingLists' is required.");
                });
            });

            it("Should return 400 if inReadingLists is not a number", async () => {
                const isbn = '9781234567890';
                const invalidinReadingLists = "not-a-number";

                // dbfindOneUpdate.mockImplementation(async () => Promise.resolve(null));

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({ inReadingLists: invalidinReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("'inReadingLists' must be a valid number.");
                });
            });

            it("Should return 400 if inReadingLists is less than 0", async () => {
                const isbn = '9781234567890';
                const inReadingLists = -10;
                dbfindOneUpdate.mockImplementation(async () => {
                    throw createValidationError(
                        "inReadingLists",
                        "The number of reading lists cannot be negative.",
                        inReadingLists,
                        "min", 0
                    );
                });

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({ inReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("Validation failed. Check the provided data.");
                    expect(response.body.details).toHaveProperty("inReadingLists");
                    expect(response.body.details.inReadingLists).toHaveProperty("message", "The number of reading lists cannot be negative.");
                    expect(response.body.details.inReadingLists).toHaveProperty("value", inReadingLists);
                    expect(response.body.details.inReadingLists.properties).toHaveProperty("type", "min");
                    expect(response.body.details.inReadingLists.properties).toHaveProperty("min", 0);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 404 if book is not found", async () => {
                const isbn = '9781234567890';
                const inReadingLists = 100;

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(null));

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({ inReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body.message).toBe('Book not found.');
                });
            });

            it("Should return 500 if an unexpected error occurs", async () => {
                const isbn = '9781234567890';
                const inReadingLists = 100;

                dbfindOneUpdate.mockImplementation(async () => Promise.reject(new Error('Unexpected error')));

                return request(app).patch(`/api/v1/books/${isbn}/readingLists`).send({ inReadingLists }).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body.message).toBe('Unexpected server error occurred.');
                    expect(response.body.error).toBe('Unexpected error');
                });                
            });
        });
        describe("PATCH /api/v1/books/:isbn/review", () => {
            let dbfindOneUpdate;

            beforeEach(() => {
                jest.clearAllMocks();
                dbfindOneUpdate = jest.spyOn(Book, 'findOneAndUpdate');
            });

            it("Should return 200 and update the totalRating and totalReviews counts successfully", async () => {
                const isbn = '1234567891';
                const totalRating = 4.5;
                const totalReviews = 3;
                const updatedBook = {
                    isbn,
                    totalRating,
                    totalReviews,
                };

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(updatedBook));

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({ totalRating, totalReviews }).then((response) => {
                    expect(response.statusCode).toBe(200);
                    expect(response.body.message).toBe('Book review stats updated successfully.');
                    expect(response.body.updatedBook.isbn).toBe(isbn);
                    expect(response.body.updatedBook.totalRating).toBe(totalRating);
                    expect(response.body.updatedBook.totalReviews).toBe(totalReviews);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 400 if ISBN format is invalid", async () => {
                const invalidIsbn = 'invalid-isbn';
                const totalRating = 4.5;
                const totalReviews = 3;

                return request(app).patch(`/api/v1/books/${invalidIsbn}/review`).send({ totalRating, totalReviews }).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe('Invalid ISBN format. Must be ISBN-10 or ISBN-13.');
                });
            });

            it("Should return 400 if totalRating and totalReviews are not provided", async () => {
                const isbn = '9781234567890';
                const totalRating = 4.5;

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({totalRating}).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("Both totalRating and totalReviews are required.");
                });
            });

            it("Should return 400 if totalRating or totalReviews are not a number", async () => {
                const isbn = '9781234567890';
                const invalidtotalRating = "not-a-number";
                const totalReviews = 3;

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({ totalRating: invalidtotalRating, totalReviews}).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("Invalid input. Both totalRating and totalReviews must be numbers.");
                });
            });

            it("Should return 400 if totalRating is greater than 5", async () => {
                const isbn = '9781234567890';
                const totalRating = 6;
                const totalReviews = 3;
                dbfindOneUpdate.mockImplementation(async () => {
                    throw createValidationError(
                        "totalRating",
                        "The total rating cannot be greater than 5.",
                        totalRating,
                        "max", 5
                    );
                });

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({ totalRating, totalReviews}).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toBe("Validation failed. Check the provided data.");
                    expect(response.body.details).toHaveProperty("totalRating");
                    expect(response.body.details.totalRating).toHaveProperty("message", "The total rating cannot be greater than 5.");
                    expect(response.body.details.totalRating).toHaveProperty("value", totalRating);
                    expect(response.body.details.totalRating.properties).toHaveProperty("type", "max");
                    expect(response.body.details.totalRating.properties).toHaveProperty("max", 5);
                    expect(dbfindOneUpdate).toBeCalled();
                });
            });

            it("Should return 404 if book is not found", async () => {
                const isbn = '9781234567890';
                const totalRating = 3;
                const totalReviews = 3;

                dbfindOneUpdate.mockImplementation(async () => Promise.resolve(null));

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({ totalRating, totalReviews }).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body.message).toBe('Book not found.');
                });
            });

            it("Should return 500 if an unexpected error occurs", async () => {
                const isbn = '9781234567890';
                const totalRating = 3;
                const totalReviews = 3;

                dbfindOneUpdate.mockImplementation(async () => Promise.reject(new Error('Unexpected error')));

                return request(app).patch(`/api/v1/books/${isbn}/review`).send({ totalRating, totalReviews }).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body.message).toBe('Unexpected server error occurred.');
                    expect(response.body.error).toBe('Unexpected error');
                });                
            });
        });
    });
    describe("healthcheck endpoint", () => {
        it("Should return 200 if the server is healthy", async () => {
            return request(app).get('/api/v1/books/healthz').then((response) => {
                expect(response.statusCode).toBe(200);
            });
        });
    });
});