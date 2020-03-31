'use strict';

module.exports.health = async event => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: 'healthy'
    };
};