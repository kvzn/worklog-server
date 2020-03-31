'use strict';

const dynamodb = require('./dynamodb');

function countAllUsers() {
    return new Promise(function (resolve, reject) {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS
        };
        dynamodb.scan(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Items.length);
        });
    });
}

function findUserById(id) {
    return new Promise(function (resolve, reject) {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS,
            IndexName: "IdIndex",
            ExpressionAttributeNames: {
                "#id": "id"
            },
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeValues: {
                ":id": id
            },
        };
        dynamodb.query(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (result.Items.length === 0) {
                resolve(null);
                return;
            } else if (result.Items.length != 1) {
                console.error("Got more than one records of the same id:", email)
                reject('Internval server error!');
                return;
            } else {
                resolve(result.Items[0])
            }
        });
    });
}

function findUserByEmail(email) {
    return new Promise(function (resolve, reject) {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS,
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ':email': email
            }
        };
        dynamodb.query(params, (error, result) => {
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

function findWorklogById(id) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            IndexName: "IdIndex",
            ExpressionAttributeNames: {
                "#id": "id"
            },
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeValues: {
                ":id": id
            },
        };
        dynamodb.query(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (result.Items.length === 0) {
                resolve(null);
                return;
            } else if (result.Items.length != 1) {
                console.error("Got more than one records of the same id:", email)
                reject('Internval server error!');
                return;
            } else {
                resolve(result.Items[0])
            }
        });
    });
}

function findWorklogOfUserAtDate(creatorId, date) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            Key: {
                creatorId,
                date
            }
        };
        dynamodb.get(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Item);
        });
    });
}

function findWorklogsOfUser(creatorId) {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            KeyConditionExpression: "creatorId = :creatorId",
            ExpressionAttributeValues: {
                ':creatorId': creatorId
            }
        };
        dynamodb.query(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Items);
        });
    });
}

function findWorklogsAll() {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_WORKLOGS,
            // IndexName: "IdIndex",
            // ExpressionAttributeNames: {
            //     "#id": "id"
            // },
            // KeyConditionExpression: "#id = :id",
            // ExpressionAttributeValues: {
            //     ":id": id
            // },
            // Limit: limit
        };
        dynamodb.scan(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Items);
        });
    });
}

function findUsersAll() {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS,
        };
        dynamodb.scan(params, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result.Items);
        });
    });
}

module.exports = {
    countAllUsers,
    findUserById,
    findUserByEmail,
    findWorklogById,
    findWorklogOfUserAtDate,
    findWorklogsOfUser,
    findWorklogsAll,
    findUsersAll
}