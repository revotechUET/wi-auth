const User = require('../models-master').User;
const LicensePackage = require('../models-master').LicensePackage;
const Feature = require('../models-master').I2gFeature;
const Api = require('../models-master').I2gApi;
const ResponseJSON = require('../response');
const ErrorCodes = require('../../error-codes').CODES;

function getUserLicense(payload, cb, username) {
    let options = {where: {username: username}, include: {}};
    switch (payload.type) {
        case "feature":
            options.include = {model: LicensePackage, include: {model: Feature}};
            break;
        case "package":
            options.include = {model: LicensePackage};
            break;
        case "button":
            options.include = { model: LicensePackage, include: { model: Feature, include: { model: Api }, where: { type: 'BUTTON' } } };
            break;
        default:
            options.include = {model: LicensePackage, include: {model: Feature, include: {model: Api}}};
            break;
    }
    User.findOne(options).then(u => {
        cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", u));
    });
}

function getAllLicensePackages(payload, cb) {
    LicensePackage.findAll({include: [{model: Feature}]}).then(lps => {
        cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", lps));
    });
}

function newLicensePackage(payload, cb) {
    LicensePackage.create(payload).then(l => {
        cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", l));
    }).catch(err => {
        cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err))
    })
}

function editLicensePackage(payload, cb) {
    LicensePackage.findByPk(payload.idLicensePackage).then(ls => {
        if (ls) {
            let featureApis = payload.i2g_feature.map(f => f.idFeature);
            Object.assign(ls, payload).save().then(l => {
                l.setI2g_features(featureApis).then(() => {
                    cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", l));
                });
            }).catch(err => {
                cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err));
            })
        } else {
            cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No package found"));
        }
    })
}

function getAllLicenseFeature(payload, cb) {
    if (payload.idLicensePackage) {
        Feature.findAll({where: {idLicensePackage: payload.idLicensePackage}}), then(f => {
            cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", f));
        })
    } else {
        Feature.findAll({include: [{model: Api}]}).then(f => {
            cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", f))
        });
    }
}

function deleteLicensePackage(payload, cb) {
    LicensePackage.findByPk(payload.idLicensePackage).then(lp => {
        if (lp) {
            lp.destroy().then(() => {
                cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", lp));
            }).catch(err => {
                cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err));
            })
        } else {
            cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No package found by id"));
        }
    })
}

function deleteFeature(payload, cb) {
    Feature.findByPk(payload.idFeature).then(f => {
        if (f) {
            f.destroy().then(() => {
                cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", f));
            }).catch(err => {
                cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err));
            })
        } else {
            cb(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No feature found by id"));
        }
    })
}


module.exports = {
    getUserLicense,
    getAllLicensePackages,
    newLicensePackage,
    editLicensePackage,
    getAllLicenseFeature,
    deleteLicensePackage,
    deleteFeature
};