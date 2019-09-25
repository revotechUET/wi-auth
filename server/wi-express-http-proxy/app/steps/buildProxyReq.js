'use strict';

let debug = require('debug')('express-http-proxy');
let requestOptions = require('../../lib/requestOptions');

function buildProxyReq(Container) {
    let req = Container.user.req;
    let res = Container.user.res;
    let options = Container.options;
    let host = Container.proxy.host;

    let parseBody = (!options.parseReqBody) ? Promise.resolve(null) : requestOptions.bodyContent(req, res, options);
    let createReqOptions = requestOptions.create(req, res, options, host);

    return Promise
        .all([parseBody, createReqOptions])
        .then(function (responseArray) {
            Container.proxy.bodyContent = responseArray[0];
            Container.proxy.reqBuilder = responseArray[1];
            debug('proxy request options:', Container.proxy.reqBuilder);
            return Container;
        });
}

module.exports = buildProxyReq;
