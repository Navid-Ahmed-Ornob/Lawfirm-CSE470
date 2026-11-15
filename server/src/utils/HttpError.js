// Throw one of these from a controller to send an error response with a status code.
// Example: throw new HttpError(404, 'Case not found.');
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = HttpError;
