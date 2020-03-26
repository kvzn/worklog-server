'use strict';

const uuid = require('uuid');
const bcrypt = require('bcryptjs');

const dynamodb = require('../../dynamodb');

const saltRounds = 8;

function existsByEmail(email) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS,
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
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
module.exports.create = async (event, context, callback) => {
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

    let exists = false;
    try {
        exists = await existsByEmail(data.email);
    } catch (error) {
        console.log("Got error while executing existsByEmail, error:", error);
        callback(null, {
            statusCode: 500
        });
        return;
    }

    if (exists) {
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
            password: hashedPassword,
            enabled: true,
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
};