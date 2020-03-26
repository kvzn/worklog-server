'use strict';

const middy = require('middy')
const authHandler = require('../../auth-handler').authHandler;

const dynamodb = require('../../dynamodb');

const handler = middy(async (event, context, callback) => {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS
    };

    let result;
    try {
        result = await dynamodb.scan(params).promise();
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to fetch the items.',
        });
        return;
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(result.Items),
    };
    callback(null, response);
});

handler.before(authHandler);

module.exports = { handler }