const request = require('supertest')
const Book = require('../../models/book');
const dbConnect = require('../../db');
const app = require('../../app');
const { toReject } = require('jest-extended');


jest.setTimeout(30000);

describe("Books DB Connection", () => {
    beforeAll(async () => {
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
        }
    });

    describe("GET /api/v1/books", () => {
        it("Should return a 200 status and a list of books", async () => {

            //Agregar un libro a la base de datos para la prueba
            const book = new Book({
                isbn: '1234567890123',
                title: 'Test Book',
                author: 'Test Author',
                publicationYear: 2020,
                description: 'Test description',
                language: 'es',
                totalPages: 250,
                categories: ['Fiction'],
                featuredType: 'bestSeller',
                totalRating: 4.5,
                totalReviews: 100,
                inReadingLists: 5,
                coverImage: 'test_cover.jpg'
            });

            await book.save();

            const response = await request(app).get('/api/v1/books');

            expect(response.status).toBe(200);

            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('isbn');
                expect(response.body[0]).toHaveProperty('title');
                expect(response.body[0]).toHaveProperty('author');
                expect(response.body[0]).toHaveProperty('publicationYear');
                expect(response.body[0]).toHaveProperty('description');
                expect(response.body[0]).toHaveProperty('language');
                expect(response.body[0]).toHaveProperty('totalPages');
                expect(response.body[0]).toHaveProperty('categories');
                expect(response.body[0]).toHaveProperty('featuredType');
                expect(response.body[0]).toHaveProperty('totalRating');
                expect(response.body[0]).toHaveProperty('totalReviews');
                expect(response.body[0]).toHaveProperty('inReadingLists');
                expect(response.body[0]).toHaveProperty('coverImage'); 
            }
        });
    });

    describe("GET /api/v1/books?", () => {
        it('Should return books filtered by author and language', async () => {
            const books = [
                new Book({ author: 'Author One', language: 'es' }),
                new Book({ author: 'Author Two', language: 'en' })
            ];
            const dbFind = jest.spyOn(Book, 'find').mockResolvedValue(books);

            const response = await request(app).get('/api/v1/books?author=Author One&language=es');

            expect(dbFind).toHaveBeenCalledWith({ author: 'Author One', language: 'es' });
            expect(response.body.length).toBe(1);
            expect(response.body[0].author).toBe('Author One');
        });
    });

    describe("Get /api/v1/books/stats", () => {
        it('Should return correct statistics', async () => {
            const stats = {
                totalBooks: 100,
                totalAuthors: 50,
                mostPopularGenre: 'Fiction',
                mostProlificAuthor: 'Author One'
            };

            const dbStats = jest.spyOn(Book, 'aggregate').mockResolvedValue(stats);

            const response = await request(app).get('/api/v1/books/stats');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(stats);
        });
    });
});
