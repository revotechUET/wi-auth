'use strict';

let url = require('url');
let debug = require('debug')('express-http-proxy');

function defaultProxyReqPathResolver(req) {
    return url.parse(req.url).path;
}

function resolveProxyReqPath(container) {
    let resolverFn = container.options.proxyReqPathResolver || defaultProxyReqPathResolver;

    return Promise
        .resolve(resolverFn(container.user.req))
        .then(function (resolvedPath) {
            container.proxy.reqBuilder.path = resolvedPath;
            debug('resolved proxy path:', resolvedPath);
            return Promise.resolve(container);
        });
}

module.exports = resolveProxyReqPath;
