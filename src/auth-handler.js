'use strict';

const jwt = require('jsonwebtoken');
const findUserByEmail = require('./helpers').findUserByEmail;

async function authHandler(handler, next) {
    const { Authorization } = handler.event.headers;
    if (Authorization && Authorization.startsWith("Bearer ")) {
        const token = Authorization.substr(7);

        try {
            const decoded = jwt.verify(token, 'secret');

            const user = await findUserByEmail(decoded.data.email);

            if (user && user.id && user.id === decoded.data.id) {
                // check expires
                delete user.password;

                handler.context.user = user;
                next()
                return;
            }
        } catch (err) {
            console.error(err);
        }
    }

    handler.callback(null, {
        statusCode: 401,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Unauthorized!',
    });
}

module.exports = { authHandler }