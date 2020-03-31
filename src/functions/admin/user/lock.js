'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')
const { authHandler, adminHandler } = require('../../../auth-handler');
const findWorklogsById = require('../../../helpers').findWorklogsById;
const moment = require('moment');
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

    const data = JSON.parse(event.body);

    if (!data) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Invalid input!',
        });
        return;
    }

    const today = moment().format('YYYY-MM-DD');
    const timestamp = new Date().getTime();

    let worklog;
    try {
        const result = await findWorklogsById(id);
        if (result.length === 1) {
            worklog = result[0];
        } else {
            throw new Error(`Got incompatible result of findWorklogsById('${id}'): ${JSON.stringify(result)}`)
        }
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

    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
        Key: {
            id,
            theDate: today
        },
        ExpressionAttributeNames: {
            '#items': 'items',
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
    .before(adminHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }