let models = require('../models-master/index');
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;

function createCompany(payload, callback) {
    models.Company.create(payload).then(com => {
        callback(ResponseJSON(errorCodes.SUCCESS, "Successfull", com));
    });
}

function editCompany(payload, callback) {
    models.Company.findById(payload.idCompany).then(comp => {
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
    models.Company.findById(payload.idCompany).then(comp => {
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
    models.Company.findById(payload.idCompany).then(comp => {
        if (comp) {
            callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", comp));
        } else {
            callback(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No company found"));
        }
    });
}

function listCompany(payload, callback) {
    models.Company.findAll().then(comps => {
        callback(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", comps));
    });
}

module.exports = {
    createCompany: createCompany,
    editCompany: editCompany,
    deleteCompany: deleteCompany,
    infoCompany: infoCompany,
    listCompany: listCompany
};