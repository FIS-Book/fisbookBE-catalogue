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
                jest.spyOn(openlibrary, "getCoverUrl").mockImplementation(async () => {
                    return null;
                });
                dbSave.mockImplementation(async () => Promise.resolve());

                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    expect(response.statusCode).toBe(201);
                    expect(response.body.book).toHaveProperty('coverImage', null);
                    expect(dbSave).toBeCalled();
                    expect(jest.spyOn(openlibrary, "getCoverUrl")).toBeCalled();
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbSave.mockImplementation(async () => {
                    throw new Error("Unexpected server error occurred.");
                });

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
                dbDelete.mockImplementation(async () => {
                    return {
                        isbn: "9788466346122",
                        title: "El día que se perdió la cordura",
                        author: "Javier Castillo",
                        publicationYear: 2015,
                        description: "Centro de Boston, 24 de diciembre, un hombre camina desnudo con la cabeza decapitada de una joven. El doctor Jenkins, director del centro psiquiátrico de la ciudad, y Stella Hyden, agente de perfiles del FBI, se adentrarán en una investigación que pondrá en juego sus vidas, su concepción de la cordura y que los llevará hasta unos sucesos fortuitos ocurridos en el misterioso pueblo de Salt Lake diecisiete años atrás.",
                        language: "es",
                        totalPages: 456,
                        categories: ["Fiction", "Thrillers", "Suspense"],
                        featuredType: "bestSeller",
                        downloadCount: 0,
                        totalRating: 0,
                        totalReviews: 0,
                        inReadingLists: 0,
                        coverImage: "https://covers.openlibrary.org/b/isbn/9788466346122-L.jpg"
                    };
                });

                return request(app).delete(`/api/v1/books/${validIsbn}`).then((response) => {
                    console.log(response.body);
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toHaveProperty("message", "Book deleted successfully");
                    expect(dbDelete).toBeCalled();
                });
            });

            it("Should return 404 if the book does not exist", async () => {
                const isbn = '9788466346122';
                dbDelete.mockImplementation(async () => {
                    return null;
                });

                return request(app).delete(`/api/v1/books/${isbn}`).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("error", "Book not found for deletion.");
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
                dbDelete.mockImplementation(async () => {
                    throw new Error("Unexpected server error occurred.");
                });

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
                description: 'A test book description.',
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
                dbUpdate.mockImplementation(async () => {
                    return {
                        isbn: '9781234567890',
                        title: 'Test Book',
                        author: 'Test Author',
                        publicationYear: 2021,
                        description: 'A test book description.',
                        language: 'en',
                        totalPages: 200,
                        categories: ['Fiction'],
                        featuredType: 'none',
                        downloadCount: 0,
                        totalRating: 0,
                        totalReviews: 2,
                        inReadingLists: 0,
                        coverImage: null
                    };
                });

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
                dbUpdate.mockImplementation(async () => {
                    return null;
                });

                return request(app).put(`/api/v1/books/${validIsbn}`).send(validBook).then((response) => {
                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("error", "Book not found for updating.");
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
                dbUpdate.mockImplementation(async () => {
                    throw new Error("Unexpected server error occurred.");
                });

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
});