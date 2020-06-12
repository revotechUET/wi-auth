'use strict';

let as = require('../../lib/as');

function getContentLength(body) {

    let result;
    if (Buffer.isBuffer(body)) { // Buffer
        result = body.length;
    } else if (typeof body === 'string') {
        result = Buffer.byteLength(body);
    }
    return result;
}


function prepareProxyReq(container) {
    return new Promise(function (resolve) {
        let bodyContent = container.proxy.bodyContent;
        let reqOpt = container.proxy.reqBuilder;

        if (bodyContent) {
            bodyContent = container.options.reqAsBuffer ?
                as.buffer(bodyContent, container.options) :
                as.bufferOrString(bodyContent);

            reqOpt.headers['content-length'] = getContentLength(bodyContent);

            if (container.options.reqBodyEncoding) {
                reqOpt.headers['Accept-Charset'] = container.options.reqBodyEncoding;
            }
        }

        container.proxy.bodyContent = bodyContent;
        resolve(container);
    });
}

module.exports = prepareProxyReq;

