// Helpers used by controllers to load the logged-in user's client or lawyer profile.
const Client = require('../models/Client');
const Lawyer = require('../models/Lawyer');
const HttpError = require('./HttpError');

async function currentClient(req) {
    const client = await Client.findByUserId(req.session.user.user_id);
    if (!client) throw new HttpError(404, 'Client profile not found.');
    return client;
}

async function currentLawyer(req) {
    const lawyer = await Lawyer.findByUserId(req.session.user.user_id);
    if (!lawyer) throw new HttpError(404, 'Lawyer profile not found.');
    return lawyer;
}

/** Parse a positive integer id from a route param or body field. */
function toId(value) {
    const id = Number.parseInt(value, 10);
    return Number.isInteger(id) && id > 0 ? id : 0;
}

module.exports = { currentClient, currentLawyer, toId };
