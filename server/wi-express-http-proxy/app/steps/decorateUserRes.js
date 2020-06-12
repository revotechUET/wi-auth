'use strict';

let as = require('../../lib/as.js');
let debug = require('debug')('express-http-proxy');
let zlib = require('zlib');

function isResGzipped(res) {
    return res.headers['content-encoding'] === 'gzip';
}

function zipOrUnzip(method) {
    return function (rspData, res) {
        return new Promise(function (resolve, reject) {
            if (isResGzipped(res) && rspData.length) {
                zlib[method](rspData, function (err, buffer) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
            } else {
                resolve(rspData);
            }
        });
    };
}

let maybeUnzipPromise = zipOrUnzip('gunzip');
let maybeZipPromise = zipOrUnzip('gzip');

function verifyBuffer(rspd, reject) {
    if (!Buffer.isBuffer(rspd)) {
        return reject(new Error('userResDecorator should return string or buffer as data'));
    }
}

function updateHeaders(res, rspdBefore, rspdAfter, reject) {
    if (!res.headersSent) {
        res.set('content-length', rspdAfter.length);
    } else if (rspdAfter.length !== rspdBefore.length) {
        let error = '"Content-Length" is already sent,' +
            'the length of response data can not be changed';
        return reject(new Error(error));
    }
}

function decorateProxyResBody(container) {
    let resolverFn = container.options.userResDecorator;

    if (!resolverFn) {
        return Promise.resolve(container);
    }

    let proxyResDataPromise = maybeUnzipPromise(container.proxy.resData, container.proxy.res);
    let proxyRes = container.proxy.res;
    let req = container.user.req;
    let res = container.user.res;
    let originalResData;

    if (res.statusCode === 304) {
        debug('Skipping userResDecorator on response 304');
        return Promise.resolve(container);
    }

    return proxyResDataPromise
        .then(function (proxyResData) {
            originalResData = proxyResData;
            return resolverFn(proxyRes, proxyResData, req, res);
        })
        .then(function (modifiedResData) {
            return new Promise(function (resolve, reject) {
                let rspd = as.buffer(modifiedResData, container.options);
                verifyBuffer(rspd, reject);
                updateHeaders(res, originalResData, rspd, reject);
                maybeZipPromise(rspd, container.proxy.res).then(function (buffer) {
                    container.proxy.resData = buffer;
                    resolve(container);
                }).catch(function (error) {
                    reject(error);
                });
            });
        });
}

module.exports = decorateProxyResBody;
