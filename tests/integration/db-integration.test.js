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

    describe("Tests Book Model Validations", () => {
        it('should fail to create a book with an invalid ISBN', async () => {
            const book = new Book({
                isbn: 'invalidISBN',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['Fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.isbn).toBeDefined();
                expect(error.errors.isbn.message).toBe('Invalid ISBN format. Must be ISBN-10 or ISBN-13.');
            }
        });

        it('should enforce unique ISBNs', async () => {
            const book1 = new Book({
                isbn: '1234567890',
                title: 'Book 1',
                author: 'John Doe',
                publicationYear: 2023,
                description: 'A valid description that is sufficiently long to meet the minimum length requirement of 100 characters. This ensures that the validation for the description field passes successfully.',
                language: 'en',
                totalPages: 100,
                categories: ['Fiction'],
            });

            const book2 = new Book({
                isbn: '1234567890',
                title: 'Book 2',
                author: 'Jane Doe',
                publicationYear: 2023,
                description: 'A valid description that is sufficiently long to meet the minimum length requirement of 100 characters. This ensures that the validation for the description field passes successfully.',
                language: 'en',
                totalPages: 120,
                categories: ['Non-fiction'],
            });

            await book1.save();

            let error;
            try {
                await book2.save();
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.code).toBe(11000); // Duplicate key error code
        });

        it('should fail to create a book with a short title', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'AB',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['Fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.title).toBeDefined();
                expect(error.errors.title.message).toBe('The title must be at least 3 characters long.');
            }
        });

        it('should fail to create a book with a title length exceeding 121 characters', async () => {
            const longTitle = 'A'.repeat(122);
            const book = new Book({
                isbn: '9876543210123',
                title: longTitle,
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['Fiction'],
            });
        
            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.title).toBeDefined();
                expect(error.errors.title.message).toBe('The title cannot be longer than 121 characters.');
            }
        });

        it('should fail to create a book with a future publication year', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: new Date().getFullYear() + 1,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.publicationYear).toBeDefined();
                expect(error.errors.publicationYear.message).toBe(`The publication year cannot be greater than the current year (${new Date().getFullYear()}).`);
            }
        });

        it('should fail to create a book with a short description', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'Short desc',
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.description).toBeDefined();
                expect(error.errors.description.message).toBe('The description must be at least 100 characters long.');
            }
        });

        it('should fail to create a book with a long description', async () => {
            const longDescription = 'A'.repeat(701);
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: longDescription,
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.description).toBeDefined();
                expect(error.errors.description.message).toBe('The description cannot be more than 700 characters long.');
            }
        });

        it('should fail to create a book with an invalid language', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'pp',
                totalPages: 200,
                categories: ['fiction'],
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.language).toBeDefined();
                expect(error.errors.language.message).toBe('The language must be one of the following: en, es, fr, de, it, pt.');
            }
        });

        it('should fail to create a book with an invalid featuredType', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
                featuredType: 'invalidType'
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.errors.featuredType).toBeDefined();
                expect(error.errors.featuredType.message).toBe('Invalid value for featuredType. It must be one of: none, bestSeller, awardWinner.');
            }
        });

        it('should fail to create a book with invalid fields in pre-save middleware', async () => {
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book Title',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'This is a test description for the book. The description must be at least 100 characters long. The description must be at least 100 characters long.',
                language: 'en',
                totalPages: 200,
                categories: ['fiction'],
                downloadCount: 5,
            });

            try {
                await book.save();
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The fields downloadCount, totalRating, totalReviews, and inReadingLists should not be included in the request.');
            }
        });

        it('should set default values for certain fields', async () => {
            const book = new Book({
                isbn: '1234567890',
                title: 'Default Values Test',
                author: 'John Doe',
                publicationYear: 2023,
                description: 'A valid description that meets all requirements. The description must be at least 100 characters long to ensure proper validation.',
                language: 'en',
                totalPages: 150,
                categories: ['Fiction'],
            });

            const savedBook = await book.save();

            expect(savedBook.featuredType).toBe('none');
            expect(savedBook.downloadCount).toBe(0);
            expect(savedBook.totalRating).toBe(0);
            expect(savedBook.totalReviews).toBe(0);
            expect(savedBook.inReadingLists).toBe(0);
            expect(savedBook.coverImage).toBeNull();
        });
    });
});
