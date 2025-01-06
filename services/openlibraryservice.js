const axios = require('axios');
const imageSize = require('image-size');
const urlJoin = require('url-join');
const debug = require('debug')('fisbookBE-catalogue-service:openlibrary');

const OPEN_LIBRARY_SERVICE = process.env.OPEN_LIBRARY_SERVICE || 'https://covers.openlibrary.org';

const getCoverUrl = async function(isbn) {
    try {
        const coverUrl = urlJoin(OPEN_LIBRARY_SERVICE, `/b/isbn/${isbn}-L.jpg`);
        const { data, status } = await axios.get(coverUrl, { responseType: 'arraybuffer' });

        if (status !== 200) {
            console.error(`Error fetching cover: Received status code ${status}`);
            return null;
        }
        const dimensions = imageSize(data);
        debug(`Image dimensions: width=${dimensions.width}, height=${dimensions.height}`);
        return (dimensions.width > 1 && dimensions.height > 1) ? coverUrl : null;
    } catch (error) {
        console.error(`Error fetching cover image for ISBN ${isbn}: ${error.message}`);
        return null;
    }
}

module.exports = {
    "getCoverUrl": getCoverUrl
}