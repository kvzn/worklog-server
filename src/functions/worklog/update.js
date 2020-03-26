'use strict';

const uuid = require('uuid');
const moment = require('moment');

const middy = require('middy')
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
        worklog = await findWorklogById(id, today);
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


handler.before(authHandler);

module.exports = { handler }