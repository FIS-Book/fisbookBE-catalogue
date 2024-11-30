const axios = require('axios');
const urlJoin = require('url-join');
const debug = require('debug')('fisbookBE-catalogue-service:openlibrary');

const OPEN_LIBRARY_SERVICE = process.env.OPEN_LIBRARY_SERVICE || 'https://covers.openlibrary.org';

const getCoverUrl = async function(isbn) {
    try {
        const coverUrl = urlJoin(OPEN_LIBRARY_SERVICE, `/b/isbn/${isbn}-L.jpg`);
        const response = await axios.get(coverUrl);
        
        if (response.status === 200) {
            debug(`Cover image retrieved successfully: ${coverUrl}`);
            return coverUrl;
        } else {
            console.error(`Error fetching cover: Received status code ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching cover image for ISBN ${isbn}: ${error.message}`);
        return null;
    }
}

module.exports = {
    "getCoverUrl": getCoverUrl
}