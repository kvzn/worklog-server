'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const findWorklogOfUserAtDate = require('../../helpers').findWorklogOfUserAtDate;

const uuid = require('uuid');
const moment = require('moment');

const dynamodb = require('../../dynamodb');

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const data = JSON.parse(event.body);

    const allBlanks = data.items.every(item => item.every(it => !it));
    if (allBlanks) {
        console.error('Invalid input!');
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
        worklog = await findWorklogOfUserAtDate(context.user.id, today);
    } catch (error) {
        console.log("Got error while executing findWorklogOfUserAtDate, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (worklog) {
        callback(null, {
            statusCode: 400,
            headers: { 'Content-Type': 'text/plain' },
            body: `Worklog of date ${today} already exists!`,
        });
        return;
    }

    // TODO: jsonSchema校验存在cors的问题

    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
        Item: {
            id: uuid.v1(),
            items: data.items,
            date: today,
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
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }