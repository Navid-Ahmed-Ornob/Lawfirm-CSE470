// Small wrapper around fetch() for talking to the Express API.
// Every request sends the session cookie, and errors become thrown Error objects
// whose message is the server's { error } text.

async function request(method, url, body) {
    const options = { method, credentials: 'include', headers: {} };

    if (body instanceof FormData) {
        options.body = body; // the browser sets the multipart Content-Type itself
    } else if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`/api${url}`, options);
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        const error = new Error((data && data.error) || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
}

const api = {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body ?? {}),
    put: (url, body) => request('PUT', url, body ?? {}),
    patch: (url, body) => request('PATCH', url, body ?? {}),
    delete: (url) => request('DELETE', url),
};

/** Build "?a=1&b=2" from an object, skipping empty values. */
export function queryString(params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) search.append(key, value);
    });
    const text = search.toString();
    return text ? `?${text}` : '';
}

export default api;
