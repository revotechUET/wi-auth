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
		default:
			options.include = {model: LicensePackage, include: {model: Feature, include: {model: Api}}};
			break;
	}
	User.findOne(options).then(u => {
		cb(ResponseJSON(ErrorCodes.SUCCESS, "Done", u));
	});
}


module.exports = {
	getUserLicense
};