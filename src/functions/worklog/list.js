'use strict';

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const findWorklogsOfUser = require('../../helpers').findWorklogsOfUser;

const handler = middy(async (event, context, callback) => {
    let worklogs;
    try {
        worklogs = await findWorklogsOfUser(context.user.id);
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Failed to fetch the items.',
        });
        return;
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(worklogs),
    };
    callback(null, response);
});

handler
    .before(authHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }