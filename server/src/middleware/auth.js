// Route guards based on the login session.

/** Allow only logged-in users. */
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please log in first.' });
    }
    next();
}

/** Allow only logged-in users with one of the given roles, e.g. requireRole('lawyer'). */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Please log in first.' });
        }
        if (!roles.includes(req.session.user.role)) {
            return res.status(403).json({ error: 'You do not have access to this page.' });
        }
        next();
    };
}

module.exports = { requireLogin, requireRole };
