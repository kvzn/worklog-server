'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dynamodb = require('../../dynamodb');

const findUserByEmail = require('../../helpers').findUserByEmail;

function makeToken(user) {
    const { id, email, name } = user;
    return jwt.sign({
        data: {
            id,
            email,
            name
        }
    }, 'secret', { expiresIn: '30d' });
}

// async will cause 502
module.exports.login = async (event, context, callback) => {
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

    const timestamp = new Date().getTime();

    let user;
    try {
        user = await findUserByEmail(data.email);
    } catch (error) {
        console.log("Got error while executing findByEmail, error:", error);
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
                email: user.email
            }
        }),
    });
};