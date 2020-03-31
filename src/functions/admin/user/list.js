'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')
const { authHandler, adminHandler } = require('../../../auth-handler');
const findUsersAll = require('../../../helpers').findUsersAll;

const handler = middy(async (event, context, callback) => {
    let users;
    try {
        users = await findUsersAll();
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to fetch the items.',
        });
        return;
    }

    const items = users.map(({ password, ...keepAttrs }) => keepAttrs)

    const response = {
        statusCode: 200,
        body: JSON.stringify(items),
    };
    callback(null, response);
});

handler
    .before(authHandler)
    .before(adminHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }