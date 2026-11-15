// Last middleware in the chain: turns thrown errors into JSON responses.
const multer = require('multer');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10 MB).' : err.message;
        return res.status(400).json({ error: message });
    }

    const status = err.status || 500;
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
}

function notFound(req, res) {
    res.status(404).json({ error: 'Not found.' });
}

module.exports = { errorHandler, notFound };
