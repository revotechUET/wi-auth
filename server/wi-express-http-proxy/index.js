'use strict';

// * Breaks proxying into a series of discrete steps, many of which can be swapped out by authors.
// * Uses Promises to support async.
// * Uses a quasi-Global called Container to tidy up the argument passing between the major work-flow steps.

let ScopeContainer = require('./lib/scopeContainer');
let assert = require('assert');
let debug = require('debug')('express-http-proxy');
let config = require('config');

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

module.exports = function proxy(userOptions) {
    return function handleProxy(req, res, next) {
        debug('[start proxy] ' + req.path);
        let host = '127.0.0.1:3000';
        switch (req.get("service")) {
            case "WI_BACKEND":
                host = process.env.WI_SVC_WI_BACKEND || config.WI_SVC_WI_BACKEND || "127.0.0.1:3000";
                break;
            case "WI_INVENTORY":
                host = process.env.WI_INVENTORY || config.WI_INVENTORY || "127.0.0.1:3000";
                break;
            case "WI_PYTHON":
                host = process.env.WI_PYTHON || config.WI_PYTHON || "127.0.0.1:3000";
                break;
            case "WI_FACIES_AI":
                host = process.env.WI_FACIES_AI || config.WI_FACIES_AI || "127.0.0.1:3000";
                break;
            case "WI_CSV_TRANSFORM":
                host = process.env.WI_CSV_TRANSFORM || config.WI_CSV_TRANSFORM || "127.0.0.1:3000";
                break;
            case "WI_BASEMAP":
                host = process.env.WI_BASEMAP || config.WI_BASEMAP || "127.0.0.1:3000";
                break;
            case "WI_PROJECT_STORAGE":
                host = process.env.WI_PROJECT_STORAGE || config.WI_PROJECT_STORAGE || "127.0.0.1:3000";
                break;
            case "WI_WBS":
                host = process.env.WI_WBS || config.WI_WBS || "127.0.0.1:3000";
                break;
            case "WI_ML_COMBINATION_SOM":
                host = process.env.WI_ML_COMBINATION_SOM || config.WI_ML_COMBINATION_SOM || "127.0.0.1:3000";
                break;
            case "WI_ML_DECISION_TREE_CLASSIFIER":
                host = process.env.WI_ML_DECISION_TREE_CLASSIFIER || config.WI_ML_DECISION_TREE_CLASSIFIER || "127.0.0.1:3000";
                break;
            case "WI_ML_DECISION_TREE_REGRESSION":
                host = process.env.WI_ML_DECISION_TREE_REGRESSION || config.WI_ML_DECISION_TREE_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_DISTRIBUTION_SOM":
                host = process.env.WI_ML_DISTRIBUTION_SOM || config.WI_ML_DISTRIBUTION_SOM || "127.0.0.1:3000";
                break;
            case "WI_ML_HUBER_REGRESSION":
                host = process.env.WI_ML_HUBER_REGRESSION || config.WI_ML_HUBER_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_KNN_CLASSIFIER":
                host = process.env.WI_ML_KNN_CLASSIFIER || config.WI_ML_KNN_CLASSIFIER || "127.0.0.1:3000";
                break;
            case "WI_ML_LASSO_REGRESSION":
                host = process.env.WI_ML_LASSO_REGRESSION || config.WI_ML_LASSO_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_LINEAR_REGRESSION":
                host = process.env.WI_ML_LINEAR_REGRESSION || config.WI_ML_LINEAR_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_LOGISTIC_REGRESSION_CLASSIFIER":
                host = process.env.WI_ML_LOGISTIC_REGRESSION_CLASSIFIER || config.WI_ML_LOGISTIC_REGRESSION_CLASSIFIER || "127.0.0.1:3000";
                break;
            case "WI_ML_LOGISTIC_REGRESSION_REGRESSION":
                host = process.env.WI_ML_LOGISTIC_REGRESSION_REGRESSION || config.WI_ML_LOGISTIC_REGRESSION_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_NON_LINEAR_REGRESSION":
                host = process.env.WI_ML_NON_LINEAR_REGRESSION || config.WI_ML_NON_LINEAR_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_RANDOM_FOREST_CLASSIFIER":
                host = process.env.WI_ML_RANDOM_FOREST_CLASSIFIER || config.WI_ML_RANDOM_FOREST_CLASSIFIER || "127.0.0.1:3000";
                break;
            case "WI_ML_RANDOM_FOREST_REGRESSION":
                host = process.env.WI_ML_RANDOM_FOREST_REGRESSION || config.WI_ML_RANDOM_FOREST_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_SUPERVISE_SOM":
                host = process.env.WI_ML_SUPERVISE_SOM || config.WI_ML_SUPERVISE_SOM || "127.0.0.1:3000";
                break;
            case "WI_ML_SVM_REGRESSION":
                host = process.env.WI_ML_SVM_REGRESSION || config.WI_ML_SVM_REGRESSION || "127.0.0.1:3000";
                break;
            case "WI_ML_UNSUPERVISE_SOM":
                host = process.env.WI_ML_UNSUPERVISE_SOM || config.WI_ML_UNSUPERVISE_SOM || "127.0.0.1:3000";
                break;
            case "WI_ML_XGBOOST_REGRESSION":
                host = process.env.WI_ML_XGBOOST_REGRESSION || config.WI_ML_XGBOOST_REGRESSION || "127.0.0.1:3000";
                break;
            default:
                host = "127.0.0.1:2999";
                break;
        }
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
                    resolver(err, res, next);
                } else {
                    next();
                }
            });
    };
};

