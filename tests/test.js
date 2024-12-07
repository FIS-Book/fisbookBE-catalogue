const request = require('supertest');
const app = require('../app.js');

describe("GET /api/v1/books", () => {
    it("Should return a 200 status and a list of books", async() => {
        const response = await request(app).get('/api/v1/books');

        expect(response.status).toBe(200);

        expect(Array.isArray(response.body)).toBe(true);

        if(response.body.length > 0) {
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

    })
});
