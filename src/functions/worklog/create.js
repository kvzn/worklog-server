'use strict';

const uuid = require('uuid');
const moment = require('moment');

const middy = require('middy')
const authHandler = require('../../auth-handler').authHandler;

const dynamodb = require('../../dynamodb');

function existsByDate(theDate) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            FilterExpression: 'theDate = :theDate',
            ExpressionAttributeValues: {
                ':theDate': theDate
            }
        };
        dynamodb.scan(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Items.length > 0)
        });
    });
}

// async will cause 502
const handler = middy(async (event, context, callback) => {
    const data = JSON.parse(event.body);
    console.log('5555555', data)
    if (typeof data.items.size === 0) {
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

    // let exists = false;
    // try {
    //     exists = await existsByDate(today);
    // } catch (error) {
    //     console.log("Got error while executing existsByDate, error:", error);
    //     callback(null, {
    //         statusCode: 500
    //     });
    //     return;
    // }

    // if (exists) {
    //     callback(null, {
    //         statusCode: 400,
    //         headers: { 'Content-Type': 'text/plain' },
    //         body: `Worklog of date ${today} already exists!`,
    //     });
    //     return;
    // }

    const params = {
        TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
        Item: {
            id: uuid.v1(),
            items: data.items,
            theDate: today,
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


handler.before(authHandler);

module.exports = { handler }