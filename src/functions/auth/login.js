'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getUserByEmail = require('../../helpers').findUserByEmail;

function makeToken(user) {
    const { id, email, name, roles } = user;
    return jwt.sign({
        data: {
            id,
            email,
            name,
            roles
        }
    }, 'secret', { expiresIn: '30d' });
}

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const data = JSON.parse(event.body);
    if (typeof data.email !== 'string') {
        console.error('Validation Failed');
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Invalid parameters!',
        });
        return;
    }

    let user;
    try {
        user = await getUserByEmail(data.email);
    } catch (error) {
        console.log("Got error while executing getUserByEmail, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (!user) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Email or passsword is wrong!',
        });
    }

    const passwordIsCorrect = bcrypt.compareSync(data.password, user.password);

    if (!passwordIsCorrect) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Email or passsword is wrong!',
        });
        return;
    }

    if (!user.enabled) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Account is disabled!',
        });
        return;
    }

    let token;
    try {
        token = makeToken(user);
    } catch (error) {
        console.error("Got error while putting data to dynamodb, error:", error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Internal Server Error!',
        });
        return;
    }

    callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            'token': token,
            'user': {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: user.roles
            }
        }),
    });
});

handler
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }