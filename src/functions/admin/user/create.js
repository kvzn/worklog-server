'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')
const {authHandler, adminHandler} = require('../../../auth-handler');
const findUserByEmail = require('../../../helpers').findUserByEmail;

const uuid = require('uuid');
const bcrypt = require('bcryptjs');

const dynamodb = require('../../../dynamodb');

const saltRounds = 8;

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const data = JSON.parse(event.body);

    if (typeof data.email !== 'string') {
        console.error('Invalid input!');
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Invalid input!',
        });
        return;
    }

    const timestamp = new Date().getTime();

    let user;
    try {
        user = await findUserByEmail(data.email);
    } catch (error) {
        console.log("Got error while executing findUserByEmail, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (user) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Email already exists!',
        });
        return;
    }

    const hashedPassword = bcrypt.hashSync(data.password, saltRounds);

    const params = {
        TableName: process.env.DYNAMODB_TABLE_USERS,
        Item: {
            id: uuid.v1(),
            name: data.name,
            email: data.email,
            roles: data.roles,
            password: hashedPassword,
            enabled: true,
            creatorId: context.user.id,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };

    try {
        await dynamodb.put(params).promise();
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
        statusCode: 200
    });
});

handler
    .before(authHandler)
    .before(adminHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }