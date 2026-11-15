// Builds the Express application: middleware, API routes and (in production) the React build.
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');

const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        name: 'lawfirm.sid',
        secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 8, // 8 hours
        },
    })
);

// JSON API
app.use('/api', apiRoutes);
app.use('/api', notFound);

// Production: serve the built React app (client/dist) from the same server.
const clientBuild = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    // Any non-API URL returns index.html so React Router can handle it.
    app.get(/^\/(?!api\/).*/, (req, res) => {
        res.sendFile(path.join(clientBuild, 'index.html'));
    });
}

app.use(errorHandler);

module.exports = app;
