'use strict';

const jwt = require('jsonwebtoken');
const getUserByEmail = require('./helpers').findUserByEmail;

async function authHandler(handler, next) {
    if (!handler.event.headers) {
        handler.callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Unauthorized!',
        });
    }
    const { Authorization } = handler.event.headers;
    if (Authorization && Authorization.startsWith("Bearer ")) {
        const token = Authorization.substr(7);

        try {
            const decoded = jwt.verify(token, 'secret');

            const user = await getUserByEmail(decoded.data.email);

            if (user && user.id && user.id === decoded.data.id) {
                // check expires
                delete user.password;

                handler.context.user = user;
                // next() // cause twice calling on function, middy will call next()
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

async function adminHandler(handler, next) {
    if (!handler.context.user.roles.includes('ADMIN')) {
        handler.callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: 'PermissionDenied',
        });
        return;
    }
}

module.exports = {
    authHandler,
    adminHandler
}