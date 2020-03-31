'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')
const { authHandler, adminHandler } = require('../../../auth-handler');
const { findUsersAll, findWorklogsAll } = require('../../../helpers');

const handler = middy(async (event, context, callback) => {
    let worklogs;
    try {
        worklogs = await findWorklogsAll();
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to fetch the items.',
        });
        return;
    }

    let users;
    try {
        users = await findUsersAll();
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to fetch users.',
        });
        return;
    }

    worklogs = worklogs.map(log => {
        const user = users.find(u => u.id === log.creatorId);
        log.creator = {
            name: !!user ? user.name : 'Unknown'
        };
        return log;
    });

    const response = {
        statusCode: 200,
        body: JSON.stringify(worklogs),
    };
    callback(null, response);
});

handler
    .before(authHandler)
    .before(adminHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }