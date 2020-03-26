'use strict';

const dynamodb = require('./dynamodb');

function findUserByEmail(email) {
    return new Promise(function (resolve, reject) {
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
            if (result.Items.length === 0) {
                resolve(null);
                return;
            } else if (result.Items.length != 1) {
                console.error("Got more than one records of the same email:", email)
                reject('Internval server error!');
                return;
            } else {
                resolve(result.Items[0])
            }
        });
    });
}

function findWorklogById(id, theDate) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            Key: {
                id,
                theDate
            }
        };
        dynamodb.get(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            
            resolve(result.Item)
        });
    });
}

module.exports = {
    findUserByEmail,
    findWorklogById
}