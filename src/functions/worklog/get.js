'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const findWorklogById = require('../../helpers').findWorklogById;

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

    let worklog;
    try {
        worklog = await findWorklogById(id);
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to get the item.',
        });
        return;
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(worklog),
    };
    callback(null, response);
});

handler
    .before(authHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }