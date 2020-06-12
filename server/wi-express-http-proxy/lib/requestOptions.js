'use strict';
let http = require('http');
let https = require('https');
let url = require('url');
let getRawBody = require('raw-body');
let isUnset = require('./isUnset');

function extend(obj, source, skips) {

    if (!source) {
        return obj;
    }

    for (let prop in source) {
        if (!skips || skips.indexOf(prop) === -1) {
            obj[prop] = source[prop];
        }
    }

    return obj;
}

function parseHost(Container) {
    let host = Container.params.host;
    let req = Container.user.req;
    let options = Container.options;
    host = (typeof host === 'function') ? host(req) : host.toString();

    if (!host) {
        return new Error('Empty host parameter');
    }

    if (!/http(s)?:\/\//.test(host)) {
        host = 'http://' + host;
    }

    let parsed = url.parse(host);

    if (!parsed.hostname) {
        return new Error('Unable to parse hostname, possibly missing protocol://?');
    }

    let ishttps = options.https || parsed.protocol === 'https:';

    return {
        host: parsed.hostname,
        port: parsed.port || (ishttps ? 443 : 80),
        module: ishttps ? https : http,
    };
}

function reqHeaders(req, options) {


    let headers = options.headers || {};

    let skipHdrs = ['connection', 'content-length'];
    if (!options.preserveHostHdr) {
        skipHdrs.push('host');
    }
    let hds = extend(headers, req.headers, skipHdrs);
    hds.connection = 'close';

    return hds;
}

function createRequestOptions(req, res, options) {

    // prepare proxyRequest

    let reqOpt = {
        headers: reqHeaders(req, options),
        method: req.method,
        path: req.path,
        params: req.params,
    };

    if (options.preserveReqSession) {
        reqOpt.session = req.session;
    }

    return Promise.resolve(reqOpt);
}

// extract to bodyContent object

function bodyContent(req, res, options) {
    let parseReqBody = isUnset(options.parseReqBody) ? true : options.parseReqBody;

    function maybeParseBody(req, limit) {
        if (req.body) {
            return Promise.resolve(req.body);
        } else {
            // Returns a promise if no callback specified and global Promise exists.

            return getRawBody(req, {
                length: req.headers['content-length'],
                limit: limit,
            });
        }
    }

    if (parseReqBody) {
        return maybeParseBody(req, options.limit);
    }
}


module.exports = {
    create: createRequestOptions,
    bodyContent: bodyContent,
    parseHost: parseHost
};
