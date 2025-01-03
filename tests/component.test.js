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
            } ;
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
                });
            });

            it("Should return 500 if there is an unexpected server error", async () => {
                dbSave.mockImplementation(async () => {
                    throw new Error("Unexpected server error occurred.");
                });
    
                return request(app).post(`/api/v1/books`).send(book).then((response) => {
                    expect(response.statusCode).toBe(500);
                    expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                });
            });

            it("Should return 400 for invalid JSON format", async () => {
                const invalidJson = '{ "isbn": "1234567891", "title": "Test Book", "author": "Test Author" ';
            
                return request(app).post('/api/v1/books').set('Content-Type', 'application/json').send(invalidJson).then((response) => {
                    expect(response.statusCode).toBe(400);
                    expect(response.body).toHaveProperty("error", "Invalid JSON format");
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
                });
            });
                
        });
    });
    // describe("GET /api/v1/books/isbn/:isbn", () => {
    //     it("Should return a book by ISBN", () => {
    //         const isbn = "2876549087653";
    //         const book = new Book({
    //                 isbn: isbn,
    //                 title: "Book One",
    //                 author: "Author One",
    //                 publicationYear: 2020,
    //                 description: "Description 1",
    //                 language: "es",
    //                 totalPages: 234,
    //                 categories: ["Fiction"],
    //         });

    //         dbFindOne = jest.spyOn(Book, "findOne");
    //         dbFindOne.mockImplementation(async () => Promise.resolve(book));

    //         return request(app).get(`/api/v1/books/isbn/${isbn}`).then((response) => {
    //             expect(response.statusCode).toBe(200);
    //             expect(response.body).toHaveProperty("isbn", isbn);
    //             expect(response.body).toHaveProperty('title', 'Book One');
    //             expect(dbFindOne).toBeCalledWith({ isbn });
    //         });
    //     });

    //     it("Should return 400 if the isbn format is invalid" , () => {
    //         const isbn = "nonExistentisbn";

    //         const dbFindOne = jest.spyOn(Book, "findOne");
    //         dbFindOne.mockImplementation(async () => Promise.resolve(null));

    //         return request(app).get(`/api/v1/books/isbn/${isbn}`).then((response) => {
    //             expect(response.statusCode).toBe(400);
    //             expect(response.body).toHaveProperty("error", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
    //         });
    //     });

    // });

    // // Test to add a new book
    // describe("POST /api/v1/books", () => {
    //     const book = {
    //         isbn: "4566678930322",
    //         title: "New Book",
    //         author: "New Author",
    //         publicationYear: 2023,
    //         description: "New Description",
    //         language: "es",
    //         totalPages: 222,
    //         categories: ['Fiction']
    //     } ;
    //     var dbSave;

    //     beforeEach(() => {
    //         dbSave = jest.spyOn(Book.prototype, "save");
    //     });

    //     it("Should add a new book if everything is fine", () => {
    //         dbSave.mockImplementation(async () => Promise.resolve(true));

    //         return request(app).post(`/api/v1/books`).send(book).then((response) => {
    //             expect(response.statusCode).toBe(201);
    //             expect(response.body).toHaveProperty("message", "Book created successfully");
    //             expect(dbSave).toBeCalled();
    //         })

    //     });

    //     it("Should return 500 if there is a problem with the connection", () => {
    //         dbSave.mockImplementation(async () => Promise.reject("Conection failed"));

    //         return request(app).post(`/api/v1/books`).send(book).then((response) => {
    //             expect(response.statusCode).toBe(500);
    //             expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
    //             expect(dbSave).toBeCalled();
    //         });
    //     });
    // });
});