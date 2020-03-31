'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

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

    let worklog;
    try {
        worklog = await findWorklogById(id);
    } catch (error) {
        console.log("Got error while executing findWorklogById, error:", error);
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

    if (worklog.creatorId !== context.user.id) {
        callback(null, {
            statusCode: 401,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Unauthorized',
        });
        return;
    }

    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
        Key: {
            creatorId: worklog.creatorId,
            date: worklog.date
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
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }