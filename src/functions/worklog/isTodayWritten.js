'use strict';

const moment = require('moment');

const middy = require('middy')
const { httpErrorHandler, cors } = require('middy/middlewares')

const authHandler = require('../../auth-handler').authHandler;

const findWorklogOfUserAtDate = require('../../helpers').findWorklogOfUserAtDate;

const handler = middy(async (event, context, callback) => {
    const today = moment().format('YYYY-MM-DD');

    let worklog;
    try {
        worklog = await findWorklogOfUserAtDate(context.user.id, today);
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
        headers: { 'Content-Type': 'text/plain' },
        body: !!worklog ? 'true' : 'false',
    };
    callback(null, response);
});

handler
    .before(authHandler)
    .use(httpErrorHandler())
    .use(cors());

module.exports = { handler }