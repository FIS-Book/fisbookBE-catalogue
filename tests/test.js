const request = require('supertest');
const Book = require('../models/book');

describe("Book Model", () => {
    describe('validateISBNFormat', () => {
        it('Should return true for valid ISBN-13', () => {
            const validISBN13 = '9781234567890';
            const result = Book.validateISBNFormat(validISBN13);
            expect(result).toBe(true);
        });

        it('Should return for valid ISBN-10', () => {
            const validISBN10 = '2678903726';
            const result = Book.validateISBNFormat(validISBN10);
            expect(result).toBe(true);
        });

        it('Should return false for invalid ISBN', () => {
            const invalidISBN = 'abc1234567890';
            const result = Book.validateISBNFormat(invalidISBN);
            expect(result).toBe(false);
        });

    });

    describe('Book Model Validation', () => {
        it('Should fail validation if isbn is missing', async () => {
            const book = new Book({
                title: 'Book 1',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'Description',
                language: 'en',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.isbn).toBeDefined();
            }
        });

        it('Should fail validation if title is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                author: 'Test Author',
                publicationYear: 2023,
                description: 'Description',
                language: 'en',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.title).toBeDefined();
            }
        });

        it('Should fail validation if author is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                publicationYear: 2023,
                description: 'Description',
                language: 'en',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.author).toBeDefined();
            }
        });

        it('Should fail validation if publicationYear is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                author: 'Author 2',
                description: 'Description',
                language: 'en',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.publicationYear).toBeDefined();
            }
        });

        it('Should fail validation if description is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                author: 'Author 2',
                publicationYear: 2023,
                language: 'en',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.description).toBeDefined();
            }
        });

        it('Should fail validation if language is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                author: 'Author 2',
                publicationYear: 2023,
                description: 'Description',
                totalPages: 300,
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.language).toBeDefined();
            }
        });

        it('Should fail validation if totalPages is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                author: 'Author 2',
                publicationYear: 2023,
                description: 'Description',
                language: 'en',
                categories: ['Fiction'],
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.totalPages).toBeDefined();
            }
        });

        it('Should fail validation if categories is missing', async () => {
            const book = new Book({
                isbn: '9781234567823',
                title: 'Book 2',
                author: 'Author 2',
                publicationYear: 2023,
                description: 'Description',
                language: 'en',
                totalPages: 300,
            });
            try {
                await book.validate();
            } catch (error) {
                expect(error.errors.categories).toBeDefined();
            }
        });

    });

    describe('incrementDownloads', () => {
        it('Should increment downloads count of a book', async () => {
            const book = new Book({
                isbn: '9781234567890',
                downloadCount: 10,
            });

            jest.spyOn(Book.prototype, 'save').mockResolvedValue(book);
    
            book.downloadCount += 1;
            const updatedBook = await book.save();
    
            expect(updatedBook.downloadCount).toBe(11);
            expect(Book.prototype.save).toHaveBeenCalled();
        });
    });

    describe('incrementInReadingLists', () => {
        it('Should increment total reading lists of a book', async () => {
            const book = new Book({
                isbn: '9781234567833',
                inReadingLists: 2,
            });

            jest.spyOn(Book.prototype, 'save').mockResolvedValue(book);
    
            book.inReadingLists += 1;
            const updatedBook = await book.save();
    
            expect(updatedBook.inReadingLists).toBe(3);
            expect(Book.prototype.save).toHaveBeenCalled();
        });
    });

    describe('Save Book', () => {
        it('Should throw error if ISBN is not unique', async () => {
            const book = new Book({
                isbn: '9781234567890',
                title: 'Book Title',
            });
    
            jest.spyOn(Book.prototype, 'save').mockImplementationOnce(() => {
                const error = new Error('E11000 duplicate key error collection');
                error.code = 11000;
                throw error;
            });
    
            try {
                await book.save();
            } catch (error) {
                expect(error.code).toBe(11000);
            }
        });
    });

});
