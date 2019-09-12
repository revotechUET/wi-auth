let jwt = require('jsonwebtoken');
let User = require('../models-master/User');

//this path can be used without authentication
const EXCEPTION_PATH = ['/company/list'];

module.exports = function () {
	return function (req, res, next) {

		//handle exception path
		if (EXCEPTION_PATH.includes(req.path)) return next();

		let token = req.body.token || req.query.token || req.header['x-access-token'] || req.get('Authorization');
		if (token) {
			jwt.verify(token, process.env.AUTH_JWTKEY || 'secretKey', function (err, decoded) {
				if (err) return res
					.status(401)
					.json({code: 401, success: false, message: 'Failed to authenticate'});

				req.decoded = decoded;
				next();
			});
		} else {
			return res.status(401).send({
				code: 401,
				success: false,
				message: 'No token provided.'
			});
		}
	}
};
