'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')
const { authHandler, adminHandler } = require('../../../auth-handler');
const findUserById = require('../../../helpers').findUserById;
const dynamodb = require('../../../dynamodb');

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const { id } = event.pathParameters;

    if (!id) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Invalid id!',
        });
        return;
    }

    let user;
    try {
        user = await findUserById(id);
    } catch (error) {
        console.log("Got error while executing findUserById, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (!user) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: `User with id ${id} doesn't exist!`,
        });
        return;
    }

    const params = {
        TableName: process.env.DYNAMODB_TABLE_USERS,
        Key: {
            email: user.email,
            name: user.name
        }
    };

    try {
        await dynamodb.delete(params).promise();
    } catch (error) {
        console.error("Got error while deleting data from dynamodb, error:", error);
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