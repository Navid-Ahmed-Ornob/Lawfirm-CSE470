// Entry point: load environment variables, then start the Express app.
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Law Firm API running on http://localhost:${PORT}`);
});
