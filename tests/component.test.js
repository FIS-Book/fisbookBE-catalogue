const app = require('../app');
const request = require('supertest');
const Book = require('../models/book');

describe("Catalogue API", () => {
    describe("GET /api/v1/books/isbn/:isbn", () => {
        it("Should return a book by ISBN", () => {
            const isbn = "2876549087653";
            const book = new Book({
                    isbn: isbn,
                    title: "Book One",
                    author: "Author One",
                    publicationYear: 2020,
                    description: "Description 1",
                    language: "es",
                    totalPages: 234,
                    categories: ["Fiction"],
            });

            dbFindOne = jest.spyOn(Book, "findOne");
            dbFindOne.mockImplementation(async () => Promise.resolve(book));

            return request(app).get(`/api/v1/books/isbn/${isbn}`).then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty("isbn", isbn);
                expect(response.body).toHaveProperty('title', 'Book One');
                expect(dbFindOne).toBeCalledWith({ isbn });
            });
        });

        it("Should return 400 if the isbn format is invalid" , () => {
            const isbn = "nonExistentisbn";

            const dbFindOne = jest.spyOn(Book, "findOne");
            dbFindOne.mockImplementation(async () => Promise.resolve(null));

            return request(app).get(`/api/v1/books/isbn/${isbn}`).then((response) => {
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty("error", "Invalid ISBN format. Must be ISBN-10 or ISBN-13.");
            });
        });

    });

    // Test to add a new book
    describe("POST /api/v1/books", () => {
        const book = {
            isbn: "4566678930322",
            title: "New Book",
            author: "New Author",
            publicationYear: 2023,
            description: "New Description",
            language: "es",
            totalPages: 222,
            categories: ['Fiction']
        } ;
        var dbSave;

        beforeEach(() => {
            dbSave = jest.spyOn(Book.prototype, "save");
        });

        it("Should add a new book if everything is fine", () => {
            dbSave.mockImplementation(async () => Promise.resolve(true));

            return request(app).post(`/api/v1/books`).send(book).then((response) => {
                expect(response.statusCode).toBe(201);
                expect(response.body).toHaveProperty("message", "Book created successfully");
                expect(dbSave).toBeCalled();
            })

        });

        it("Should return 500 if there is a problem with the connection", () => {
            dbSave.mockImplementation(async () => Promise.reject("Conection failed"));

            return request(app).post(`/api/v1/books`).send(book).then((response) => {
                expect(response.statusCode).toBe(500);
                expect(response.body).toHaveProperty("error", "Unexpected server error occurred.");
                expect(dbSave).toBeCalled();
            });
        });
    });
});