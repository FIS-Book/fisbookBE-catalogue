require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../../models/book');

jest.setTimeout(30000);

describe("Integration Tests - Books DB Connection", () => {
    let dbConnect;

    beforeAll(async () => {
        await mongoose.connect(`${process.env.MONGO_URI_CATALOGUE_TEST}`);

        dbConnect = mongoose.connection;

        if (dbConnect.readyState == 1) {
            return;
        }

        await new Promise((resolve, reject) => {
            dbConnect.on("connected", resolve);
            dbConnect.on("error", reject);
        });
    });

    beforeEach(async () => {
        await Book.deleteMany({});
    });

    afterAll(async () => {
        if (dbConnect.readyState == 1) {
            await dbConnect.dropDatabase();
            await dbConnect.close();
            await mongoose.disconnect();
        }
    });

    describe("Tests CRUD operations", () => {
        it('should create and save a book successfully', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2020,
                description: 'Test description - The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long',
                language: 'es',
                totalPages: 250,
                categories: ['Fiction'],
                featuredType: 'bestSeller'
            });

            const savedBook = await book.save();
            expect(savedBook._id).toBeDefined();
            expect(savedBook.isbn).toBe('1234567890123');
        });

        it('should fetch a book by ISBN', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
            });

            await book.save();

            const foundBook = await Book.findOne({ isbn: '1234567890123' });
            expect(foundBook).toBeDefined();
            expect(foundBook.title).toBe('Test Book Title');
        });

        it('should update a book successfully', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2020,
                description: 'Test description - The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long',
                language: 'es',
                totalPages: 250,
                categories: ['Fiction'],
                featuredType: 'bestSeller'
            });
            const updatedBookData = {
                title: 'Updated Title',
                author: 'Updated Author',
                publicationYear: 2024,
                description: 'Updated description for the book.',
                language: 'es',
                totalPages: 250,
                categories: ['non-fiction'],
            };

            await book.save();
            const updatedBook = await Book.findOneAndUpdate({ isbn: book.isbn }, updatedBookData, { new: true });
            expect(updatedBook).toBeDefined();
            expect(updatedBook.title).toBe('Updated Title');
            expect(updatedBook.author).toBe('Updated Author');
            expect(updatedBook.publicationYear).toBe(2024);
            expect(updatedBook.description).toBe('Updated description for the book.');
            expect(updatedBook.language).toBe('es');
            expect(updatedBook.totalPages).toBe(250);
            expect(updatedBook.categories).toEqual(['non-fiction']);
        });

        it('should delete a book successfully', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2020,
                description: 'Test description - The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long The description must be at least 100 characters long',
                language: 'es',
                totalPages: 250,
                categories: ['Fiction'],
                featuredType: 'bestSeller'
            });

            const savedBook = await book.save();
            await Book.deleteOne({ isbn: savedBook.isbn });
            const deletedBook = await Book.findOne({ isbn: savedBook.isbn });

            expect(deletedBook).toBeNull();
        });

    });
});
