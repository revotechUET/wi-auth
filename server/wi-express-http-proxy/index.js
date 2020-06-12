'use strict';

// * Breaks proxying into a series of discrete steps, many of which can be swapped out by authors.
// * Uses Promises to support async.
// * Uses a quasi-Global called Container to tidy up the argument passing between the major work-flow steps.

let ScopeContainer = require('./lib/scopeContainer');
let debug = require('debug')('express-http-proxy');
let config = require('config');
let ResponseJSON = require("../response");

let buildProxyReq = require('./app/steps/buildProxyReq');
let copyProxyResHeadersToUserRes = require('./app/steps/copyProxyResHeadersToUserRes');
let decorateProxyReqBody = require('./app/steps/decorateProxyReqBody');
let decorateProxyReqOpts = require('./app/steps/decorateProxyReqOpts');
let decorateUserRes = require('./app/steps/decorateUserRes');
let decorateUserResHeaders = require('./app/steps/decorateUserResHeaders');
let filterUserRequest = require('./app/steps/filterUserRequest');
let handleProxyErrors = require('./app/steps/handleProxyErrors');
let maybeSkipToNextHandler = require('./app/steps/maybeSkipToNextHandler');
let prepareProxyReq = require('./app/steps/prepareProxyReq');
let resolveProxyHost = require('./app/steps/resolveProxyHost');
let resolveProxyReqPath = require('./app/steps/resolveProxyReqPath');
let sendProxyRequest = require('./app/steps/sendProxyRequest');
let sendUserRes = require('./app/steps/sendUserRes');
let checkLicensePermission = require('../license/check-license-permission');
const jwtDecode = require('jwt-decode');
let jwt = require('jsonwebtoken');

const isMultipartRequest = function (req) {
    let contentTypeHeader = req.headers['content-type'];
    var secretKey = 'secretKey';
    var decoded = jwtDecode(req.get('Authorization'));
    let data = decoded.ext;
    let newToken = jwt.sign(data, secretKey);
    req.headers['Authorization'] = newToken;
    return contentTypeHeader && contentTypeHeader.indexOf('multipart') > -1;
};

module.exports = function proxy() {
    return function handleProxy(req, res, next) {
        let userOptions = {
            reqAsBuffer: !!isMultipartRequest(req),
            reqBodyEncoding: isMultipartRequest(req) ? null : true,
            parseReqBody: !isMultipartRequest(req)
        };
        debug('[start proxy] ' + req.path);
        let host = '127.0.0.1:2999';
        let service = req.get("service") || req.query.service;
        switch (service) {
            case "WI_PROCESSING":
                host = process.env.WI_PROCESSING || config.WI_PROCESSING || "unknown.i2g.cloud";
            case "WI_BACKEND":
                host = process.env.WI_BACKEND || config.WI_BACKEND || "unknown.i2g.cloud";
                break;
            case "WI_INVENTORY":
                host = process.env.WI_INVENTORY || config.WI_INVENTORY || "unknown.i2g.cloud";
                break;
            case "WI_PYTHON":
                host = process.env.WI_PYTHON || config.WI_PYTHON || "unknown.i2g.cloud";
                break;
            case "WI_FACIES_AI":
                host = process.env.WI_FACIES_AI || config.WI_FACIES_AI || "unknown.i2g.cloud";
                break;
            case "WI_CSV_TRANSFORM":
                host = process.env.WI_CSV_TRANSFORM || config.WI_CSV_TRANSFORM || "unknown.i2g.cloud";
                break;
            case "WI_BASEMAP":
                host = process.env.WI_BASEMAP || config.WI_BASEMAP || "unknown.i2g.cloud";
                break;
            case "WI_PROJECT_STORAGE":
                host = process.env.WI_PROJECT_STORAGE || config.WI_PROJECT_STORAGE || "unknown.i2g.cloud";
                break;
            case "WI_WBS":
                host = process.env.WI_WBS || config.WI_WBS || "unknown.i2g.cloud";
                break;
            case "WI_ML_COMBINATION_SOM":
                host = process.env.WI_ML_COMBINATION_SOM || config.WI_ML_COMBINATION_SOM || "unknown.i2g.cloud";
                break;
            case "WI_ML_DECISION_TREE_CLASSIFIER":
                host = process.env.WI_ML_DECISION_TREE_CLASSIFIER || config.WI_ML_DECISION_TREE_CLASSIFIER || "unknown.i2g.cloud";
                break;
            case "WI_ML_DECISION_TREE_REGRESSION":
                host = process.env.WI_ML_DECISION_TREE_REGRESSION || config.WI_ML_DECISION_TREE_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_DISTRIBUTION_SOM":
                host = process.env.WI_ML_DISTRIBUTION_SOM || config.WI_ML_DISTRIBUTION_SOM || "unknown.i2g.cloud";
                break;
            case "WI_ML_HUBER_REGRESSION":
                host = process.env.WI_ML_HUBER_REGRESSION || config.WI_ML_HUBER_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_KNN_CLASSIFIER":
                host = process.env.WI_ML_KNN_CLASSIFIER || config.WI_ML_KNN_CLASSIFIER || "unknown.i2g.cloud";
                break;
            case "WI_ML_LASSO_REGRESSION":
                host = process.env.WI_ML_LASSO_REGRESSION || config.WI_ML_LASSO_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_LINEAR_REGRESSION":
                host = process.env.WI_ML_LINEAR_REGRESSION || config.WI_ML_LINEAR_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_LOGISTIC_REGRESSION_CLASSIFIER":
                host = process.env.WI_ML_LOGISTIC_REGRESSION_CLASSIFIER || config.WI_ML_LOGISTIC_REGRESSION_CLASSIFIER || "unknown.i2g.cloud";
                break;
            case "WI_ML_NEURAL_NETWORK_CLASSIFIER":
                host = process.env.WI_ML_NEURAL_NETWORK_CLASSIFIER || config.WI_ML_NEURAL_NETWORK_CLASSIFIER || "unknown.i2g.cloud";
                break;
            case "WI_ML_NEURAL_NETWORK_REGRESSION":
                host = process.env.WI_ML_NEURAL_NETWORK_REGRESSION || config.WI_ML_NEURAL_NETWORK_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_NON_LINEAR_REGRESSION":
                host = process.env.WI_ML_NON_LINEAR_REGRESSION || config.WI_ML_NON_LINEAR_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_RANDOM_FOREST_CASSIFIER":
                host = process.env.WI_ML_RANDOM_FOREST_CASSIFIER || config.WI_ML_RANDOM_FOREST_CASSIFIER || "unknown.i2g.cloud";
                break;
            case "WI_ML_RANDOM_FOREST_REGRESSION":
                host = process.env.WI_ML_RANDOM_FOREST_REGRESSION || config.WI_ML_RANDOM_FOREST_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_SUPERVISE_SOM":
                host = process.env.WI_ML_SUPERVISE_SOM || config.WI_ML_SUPERVISE_SOM || "unknown.i2g.cloud";
                break;
            case "WI_ML_SVM_REGRESSION":
                host = process.env.WI_ML_SVM_REGRESSION || config.WI_ML_SVM_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_ML_UNSUPERVISE_SOM":
                host = process.env.WI_ML_UNSUPERVISE_SOM || config.WI_ML_UNSUPERVISE_SOM || "unknown.i2g.cloud";
                break;
            case "WI_ML_XGBOOST_REGRESSION":
                host = process.env.WI_ML_XGBOOST_REGRESSION || config.WI_ML_XGBOOST_REGRESSION || "unknown.i2g.cloud";
                break;
            case "WI_FILE_PREVIEW":
                host = process.env.WI_FILE_PREVIEW || config.WI_FILE_PREVIEW || "unknown.i2g.cloud";
                break;
            default:
                return next();
        }
        delete req.headers['service'];
        checkLicensePermission(req, service).then(() => {
            console.log("Forwarded ", req.originalUrl, " to ", host);
            let container = new ScopeContainer(req, res, next, host, userOptions);

            filterUserRequest(container)
                .then(buildProxyReq)
                .then(resolveProxyHost)
                .then(decorateProxyReqOpts)
                .then(resolveProxyReqPath)
                .then(decorateProxyReqBody)
                .then(prepareProxyReq)
                .then(sendProxyRequest)
                .then(maybeSkipToNextHandler)
                .then(copyProxyResHeadersToUserRes)
                .then(decorateUserResHeaders)
                .then(decorateUserRes)
                .then(sendUserRes)
                .catch(function (err) {
                    // I sometimes reject without an error to shortcircuit the remaining
                    // steps and return control to the host application.

                    if (err) {
                        let resolver = (container.options.proxyErrorHandler) ?
                            container.options.proxyErrorHandler :
                            handleProxyErrors;
                        if (err.code === "ECONNREFUSED") {
                            res.send(ResponseJSON(512, "Our Service Temporarily Unavailable", "Our Service Temporarily Unavailable"));
                            res.end();
                        } else {
                            resolver(err, res, next);
                        }
                    } else {
                        next();
                    }
                });
        }).catch(() => {
            res.send(ResponseJSON(512, "Your license is not valid for this feature!", "Your license is not valid for this feature"));
            res.end();
        });
    };
};

