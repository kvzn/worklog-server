'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const moment = require('moment');

const findWorklogById = require('../../helpers').findWorklogById;

const dynamodb = require('../../dynamodb');

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

    const data = JSON.parse(event.body);

    const allBlanks = data.items.every(item => item.every(it => !it));
    if (allBlanks) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Invalid input!',
        });
        return;
    }

    let worklog;
    try {
        worklog = await findWorklogById(id);
    } catch (error) {
        console.log("Got error while executing findWorklogsById, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (!worklog) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: `Worklog with id ${id} doesn't exist!`,
        });
        return;
    }

    const timestamp = new Date().getTime();

    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
        Key: {
            creatorId: worklog.creatorId,
            date: worklog.date
        },
        ExpressionAttributeNames: {
            '#items': 'items'
        },
        ExpressionAttributeValues: {
            ':items': data.items,
            ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET #items = :items, updatedAt = :updatedAt',
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