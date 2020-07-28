let models = require("../models-master/index");
let RefreshToken = models.RefreshToken;
let randToken = require('rand-token');
const asyncEach = require('async/each');
const { JsonWebTokenError, decode, sign } = require("jsonwebtoken");
const TIME_OUT = 1000 * 60 * 60 * 24 * 2;
let secretKey = process.env.AUTH_JWTKEY || "secretKey";

let createRefreshToken = function (wi_client, token, client_id, idUser, callback) {
	let refreshToken = new Object();
	refreshToken.refreshToken = randToken.uid(64);
	refreshToken.idUser = idUser;
	refreshToken.expiredAt = Date.now() + TIME_OUT;
	refreshToken.client_id = client_id;
	refreshToken.token = token;
	refreshToken.wi_client = wi_client;
	refreshToken.userAgent = decode(token).username;
	RefreshToken.findOrCreate({
		where: {
			client_id: client_id,
			wi_client: wi_client
		},
		defaults: refreshToken
	}).then(rs => {
		callback(rs[0].toJSON());
	}).catch(err => {
		console.log(err);
		callback(null);
	});
}

let findRefreshToken = async function (opts) {
	return RefreshToken.findOne({ where: opts })
};

let checkRefreshToken = function (refreshToken, callback) {
	RefreshToken.findOne({ where: { refreshToken: refreshToken } }).then(rs => {
		if (rs) {
			callback(rs);
		} else {
			callback(null);
		}
	});
}

let renewRefreshToken = function (refreshToken, callback) {
	RefreshToken.findOne({ where: { refreshToken: refreshToken } }).then(rs => {
		if (rs) {
			let decoded = decode(rs.token);
			delete decoded.iat;
			delete decoded.exp;
			rs.expiredAt = Date.now() + TIME_OUT;
			rs.refreshToken = randToken.uid(64);
			rs.token = sign(decoded, secretKey, { expiresIn: '48h' });
			rs.save().then((r) => {
				callback(r.token, r.refreshToken);
			});
		} else {
			callback(null);
		}
	});
}

let destroyRefreshToken = function (token, callback) {
	RefreshToken.findOne({ where: { refreshToken: token } }).then(rs => {
		if (rs) {
			rs.destroy().then(() => {
				callback(token);
			});
		} else {
			callback(null);
		}
	}).catch(err => {
		console.log(err);
		callback(null);
	});
}

let clearTokenByUser = function (idUser, callback) {
	RefreshToken.findAll({ where: { idUser: idUser } }).then(tokens => {
		asyncEach(tokens, function (token, next) {
			token.destroy().then(() => {
				console.log("Deleted refresh token : ", token.refreshToken);
				next();
			}).catch(err => {
				next();
			});
		}, function () {
			callback(false, true);
		});
	}).catch(err => {
		callback(err, null);
	});
};
setTimeout(function () {
	console.log("Start clean refresh token");
	RefreshToken.findAll().then(tokens => {
		asyncEach(tokens, function (token, next) {
			if (token.expiredAt - Date.now() < 0) {
				token.destroy().then(() => {
					console.log("Destroy refresh token : ", token.refreshToken);
					next();
				}).catch(err => {
					next();
				})
			} else {
				next();
			}
		}, function () {
			console.log("Done");
		});
	}).catch(err => {
		console.log(err);
	});
}, 3000);

setInterval(function () {
	console.log("=============>>>>Clean refresh token<<<<==============");
	RefreshToken.findAll().then(tokens => {
		asyncEach(tokens, function (token, next) {
			if (token.expiredAt - Date.now() < 0) {
				token.destroy().then(() => {
					console.log("Destroy refresh token : ", token.refreshToken);
					next();
				}).catch(err => {
					next();
				})
			} else {
				next();
			}
		}, function () {
			console.log("Done");
		});
	}).catch(err => {
		console.log(err);
	});
}, 1000 * 60 * 60);
module.exports = {
	createRefreshToken: createRefreshToken,
	checkRefreshToken: checkRefreshToken,
	renewRefreshToken: renewRefreshToken,
	destroyRefreshToken: destroyRefreshToken,
	clearTokenByUser: clearTokenByUser,
	findRefreshToken
};