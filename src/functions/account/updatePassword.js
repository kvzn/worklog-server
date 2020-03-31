'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const findUserByEmail = require('../../helpers').findUserByEmail;

const dynamodb = require('../../dynamodb');

const bcrypt = require('bcryptjs');

const saltRounds = 8;

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const data = JSON.parse(event.body);

    let user;
    try {
        user = await findUserByEmail(context.user.email);
    } catch (error) {
        console.log("Got error while executing findUserByEmail, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (!user) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Email or old passsword is wrong!',
        });
    }

    const passwordIsCorrect = bcrypt.compareSync(data.oldPassword, user.password);

    if (!passwordIsCorrect) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Email or old passsword is wrong!',
        });
        return;
    }

    const timestamp = new Date().getTime();

    const hashedPassword = bcrypt.hashSync(data.newPassword, saltRounds);

    const params = {
        TableName: process.env.DYNAMODB_TABLE_USERS,
        Key: {
            email: user.email,
            name: user.name
        },
        ExpressionAttributeNames: {
            '#password': 'password',
        },
        ExpressionAttributeValues: {
            ':password': hashedPassword,
            ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET #password = :password, updatedAt = :updatedAt',
    };

    try {
        await dynamodb.update(params).promise();
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
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }