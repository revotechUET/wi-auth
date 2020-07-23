let models = require('../models-master/index');
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let async = require('async');
let crypto = require('crypto');
const { resolve } = require('path');

function getRandomHash() {
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    return (crypto.createHash('sha1').update(current_date + random).digest('hex'));
}

function createCompany(payload, callback) {
    payload.storage_location = getRandomHash();
    models.Company.create(payload).then(com => {
        callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", com));
    }).catch(err => {
        console.log(err);
        callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err.message));
    });
}

function editCompany(payload, callback) {
    models.Company.findByPk(payload.idCompany).then(comp => {
        if (comp) {
            Object.assign(comp, payload).save().then(c => {
                callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", c));
            }).catch(err => {
                callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error", err.message));
            })
        } else {
            callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No company found by id"));
        }
    });
}

function deleteCompany(payload, callback) {
    models.Company.findByPk(payload.idCompany).then(comp => {
        if (comp) {
            comp.destroy().then(() => {
                callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", comp));
            }).catch(err => {
                callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error", err.message));
            })
        } else {
            callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No company found"));
        }
    });
}

function infoCompany(payload, callback) {
    models.Company.findByPk(payload.idCompany).then(comp => {
        if (comp) {
            callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", comp));
        } else {
            callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No company found"));
        }
    });
}

function listCompany(payload, callback) {
    let resp = [];
    models.Company.findAll().then(comps => {
        async.each(comps, function (comp, next) {
            comp = comp.toJSON();
            models.User.findAndCountAll({ where: { idCompany: comp.idCompany, status: "Active" } }).then(users => {
                comp.users = users.count;
                resp.push(comp);
                next();
            })
        }, function () {
            callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", resp));
        })
    });
}


function findCompanyByDomain(_domain) {
    return new Promise(resolve => {
        models.Company.findAll().then(comps => {
            let compWithDomain = comps.find(comp => JSON.parse(comp.domains).includes(_domain));
            let compDefault = comps.find(comp => comp.name === "Default");
            if (compWithDomain) {
                return resolve(compWithDomain.toJSON());
            } else if (compDefault) {
                return resolve(compDefault.toJSON());
            } else {
                console.log("No company default found");
                resolve(null);
            }
        });
    });
};

module.exports = {
    createCompany: createCompany,
    editCompany: editCompany,
    deleteCompany: deleteCompany,
    infoCompany: infoCompany,
    listCompany: listCompany,
    findCompanyByDomain
};