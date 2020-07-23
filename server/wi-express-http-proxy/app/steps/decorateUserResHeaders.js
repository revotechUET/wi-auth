'use strict';


function decorateUserResHeaders(container) {
    let resolverFn = container.options.userResHeaderDecorator;
    // let headers = container.user.res._headers;
    let headers = container.user.res.getHeaders();

    if (!resolverFn) {
        return Promise.resolve(container);
    }

    return Promise
        .resolve(resolverFn(headers, container.user.req, container.user.res, container.proxy.req, container.proxy.res))
        .then(function (headers) {
            return new Promise(function (resolve) {
                container.user.res.set(headers);
                resolve(container);
            });
        });
}

module.exports = decorateUserResHeaders;
