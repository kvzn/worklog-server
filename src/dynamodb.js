'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

// https://stackoverflow.com/a/43208130/385127
let options = {
    convertEmptyValues: true
};

// connect to local DB if running offline
if (process.env.NODE_ENV == 'dev') {
    options = {
        region: 'localhost',
        endpoint: 'http://localhost:6000',
        convertEmptyValues: true
    };
}

const client = new AWS.DynamoDB.DocumentClient(options);

module.exports = client;