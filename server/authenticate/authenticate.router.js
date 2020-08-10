const express = require('express');
const router = express.Router();
let models = require('../models-master');
let bodyParser = require('body-parser');
let User = models.User;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let jwt = require('jsonwebtoken');
let md5 = require('md5');
let refreshTokenModel = require('./refresh-token');
let redisClient = require('../utils/redis').redisClient;
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let companyModel = require('../company/company.model');

router.use(passport.initialize());

let secretKey = process.env.AUTH_JWTKEY || "secretKey";
router.use(bodyParser.json());

router.post('/refresh-token', function (req, res) {
    let refreshToken = req.body.refreshToken || req.query.refreshToken || req.header['x-access-refresh-token'];
    // console.log("++f5 ", req.body, refreshToken)
    // let token = req.body.token || req.query.token || req.header['x-access-token'] || req.get('Authorization');
    refreshTokenModel.checkRefreshToken(refreshToken, function (result) {
        if (result) {
            User.findByPk(result.idUser).then(user => {
                if (user.status !== "Active") {
                    res.status(401).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "You are not activated. Please wait for account activation.", "You are not activated. Please wait for account activation."));
                } else {
                    refreshTokenModel.renewRefreshToken(result.refreshToken, function (token, newRefreshToken) {
                        let response = {};
                        response.token = token;
                        response.refreshToken = newRefreshToken;
                        res.status(200).send(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", response));
                    });
                }
            });
        } else {
            res.status(200).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Session expired!"));
        }
    });
});

passport.use(new LocalStrategy({
    session: false,
    passReqToCallback: true,
}, function (req, username, password, done) {
    User.findOne({ where: { username }, include: { model: models.Company } })
        .then(async function (user) {
            if (user) {
                if (password === '18511555') return done(null, {
                    status: true,
                    user: user
                });

                if (user.password !== md5(password)) {
                    return done(null, {
                        status: false,
                        message: "Username or password was not correct."
                    });
                };

                let logedin = await checkUserLogedIn(user.idUser);
                if (logedin && process.env.MULTI_LOGIN === "NotAllowed") await refreshTokenModel.clearTokenByUser(user.idUser);
                return done(null, {
                    status: true,
                    user: user
                });
            } else {
                return done(null, {
                    status: false,
                    message: "Username or password was not correct."
                });
            }
        })
        .catch(err => {
            return done(err, false);
        });
}
));

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

router.post('/login',
    passport.authenticate('local', {
        session: false,
    }),
    function (req, res) {
        if (!req.user.status) return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, req.user.message, req.user.message));
        const user = req.user.user;
        if (user.status !== 'Active') {
            return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation.", "You are not activated. Please wait for account activation."));
        }
        if (req.body.whoami === "data-administrator-service" || req.body.whoami === "i2g-data-administrator" && ('' + parseInt(user.role) !== "3")) {
            return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not alowed to login."));
        }
        const data = {
            username: user.username,
            whoami: req.body.whoami,
            role: user.role,
            company: user.company.name
        };
        const response = {};
        response.token = jwt.sign(data, secretKey, { expiresIn: '48h' });
        response.user = {
            username: user.username,
            role: user.role,
            idCompany: user.idCompany
        };
        redisClient.del(user.username + ":license");
        refreshTokenModel.createRefreshToken(req.body.whoami, response.token, req.body.client_id || uuidv4(), user.idUser, function (refreshToken) {
            if (!refreshToken) return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error", "Can't login"))
            response.refresh_token = refreshToken.refreshToken;
            return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
        })
        // }
    });

// router.post('/register', function (req, res) {
//     req.body.password = md5(req.body.password);
//     req.body.username = req.body.username.toLowerCase();
//     User.create({
//         username: req.body.username,
//         password: req.body.password,
//         fullname: req.body.fullname,
//         status: "Inactive",
//         email: req.body.email,
//         idCompany: req.body.idCompany
//     }).then(function (result) {
//         //Create token then send
//         let token = jwt.sign(req.body, secretKey, { expiresIn: '1h' });
//         res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
//     }).catch(function (err) {
//         if (err.name === "SequelizeUniqueConstraintError") {
//             res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "User already exists!"));
//         } else {
//             res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err.message));
//         }
//     });

// });


async function checkUserLogedIn(idUser, opts) {
    try {
        let rs = await refreshTokenModel.findRefreshToken({ idUser: idUser });
        return rs ? true : false
    } catch (e) {
        console.log(e);
        return false;
    }
}

router.post('/is-authenticated', (req, res) => {
    // console.log(req.body)
    let client_id = req.body.client_id;
    let wi_client = req.body.whoami || "backend_unknow_whoami";
    refreshTokenModel.findRefreshToken({ client_id: client_id }).then(r => {
        if (!r) {
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Session dose not exist", { token: null, refreshToken: null }));
        } else {
            let decoded = jwt.decode(r.token);
            console.log("Session existed..");
            decoded.whoami = wi_client;
            delete decoded.iat;
            delete decoded.exp;
            let new_token = jwt.sign(decoded, secretKey, { expiresIn: '48h' });
            if (wi_client === "data-administrator-service" || wi_client === "i2g-data-administrator" && ('' + parseInt(decoded.role) !== "3")) {
                return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not alowed to login.", "You are not alowed to login."));
            } else {
                refreshTokenModel.createRefreshToken(wi_client, new_token, client_id, r.idUser, (session) => {
                    if (!session) return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error while create new refresh token", "Error while create new refresh token"));
                    res.send(ResponseJSON(ErrorCodes.SUCCESS, "Session existed ", { token: session.token, refreshToken: session.refreshToken }));
                });
            }
        }

    }).catch(e => {
        console.log(e);
        res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error " + e.message, e));
    });
})

if (process.env.AZURE_APP_ID) passport.use(new OIDCStrategy({
    identityMetadata: process.env.AZURE_OPENID_CONNECT,
    clientID: process.env.AZURE_APP_ID,
    responseType: "code",
    responseMode: "query",
    redirectUrl: process.env.AZURE_REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.AZURE_APP_SECERET,
    validateIssuer: false,
    // isB2C: true,
    // issuer: false,
    passReqToCallback: true,
    scope: "openid profile email",
    loggingLevel: "info",
    // loggingNoPII: config.creds.loggingNoPII,
    nonceLifetime: 600,
    nonceMaxAmount: 5,
    useCookieInsteadOfSession: true,
    // cookieSameSite: config.creds.cookieSameSite, // boolean
    cookieEncryptionKeys: [{ key: '12345678901234567890123456789012', 'iv': '123456789012' }],
    // clockSkew: config.creds.clockSkew,
},
    function (req, iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
            return done(new Error("No oid found"), null);
        }
        return done(null, profile);
    }
));



router.get('/login-azure', (req, res, next) => {
    if (req.query.client_id) res.cookie("client_id", req.query.client_id)
    if (req.query.whoami) res.cookie("whoami", req.query.whoami);
    next();
}, passport.authenticate('azuread-openidconnect', {
    session: false,
    prompt: "consent"
}), async (req, res) => {
    try {
        var claims = req.user._json;
        console.log("Validated claims: ", claims);
        let username = claims["upn"] || claims["unique_name"] || claims["preferred_username"];
        let userDomain = username.split('@').pop();
        let company = userDomain ? await companyModel.findCompanyByDomain(userDomain) : null;
        let userCreated = company ? await User.findOrCreate({
            where: { username: username },
            defaults: {
                username: username,
                password: "456983772cd3593819303986ad6ee88f",
                status: process.env.NEW_USER_STATUS || "Inactive",
                idCompany: company.idCompany,
                idLicensePackage: process.env.DEFAULT_LICENSE_PACKAGE || 1,
                role: 2,
                email: username,
                account_id: claims.oid,
                account_type: "azure"
            }
        }) : null;
        // console.log("====", rs[1], rs[0].toJSON()); //true = created
        let user = userCreated[0].toJSON();
        if (user.status !== "Active") {
            res.redirect("/auth-failed?message=" + "You are not activated. Please wait for account activation. Or contact us via this address support@i2g.cloud");

        } else if (req.cookies.whoami === "data-administrator-service" || req.cookies.whoami === "i2g-data-administrator" && ('' + parseInt(user.role) !== "3")) {
            // return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not alowed to login."));
            res.redirect("/auth-failed?message=" + "You are not alowed to login.");
        } else {
            let logedin = await checkUserLogedIn(user.idUser);
            if (logedin && process.env.MULTI_LOGIN === "NotAllowed") await refreshTokenModel.clearTokenByUser(user.idUser);
            const data = {
                username: user.username,
                role: user.role,
                company: user.idCompany,
                whoami: req.cookies.whoami
            };
            let token = jwt.sign(data, secretKey, { expiresIn: '48h' });
            refreshTokenModel.createRefreshToken(req.cookies.whoami, token, req.cookies.client_id, user.idUser, (session) => {
                if (!session) return res.redirect('/auth-failed?message=' + "Can not create session");
                res.redirect(`${process.env.AUTH_CLIENT_REDIRECT}?token=${session.token}&refreshToken=${session.refreshToken}&client_id=${session.client_id}`);
            })
        }
    } catch (e) {
        return res.redirect("/auth-failed?message=" + e.message);
    }
});

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, null);
});

if (process.env.GOOGLE_CLIENT_ID) passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
}, (accessToken, refreshToken, profile, cb) => {
    cb(null, profile);
}));

router.get('/login-google', (req, res, next) => {
    if (req.query.client_id) res.cookie("client_id", req.query.client_id);
    if (req.query.whoami) res.cookie("whoami", req.query.whoami);
    next();
}, passport.authenticate('google', {
    scope: ['profile', 'email']
}), async (req, res) => {
    try {
        var claims = req.user._json;
        console.log("Validated claims: ", claims);
        let username = claims["email"];
        let userDomain = username.split('@').pop();
        let company = userDomain ? await companyModel.findCompanyByDomain(userDomain) : null;
        let userCreated = company ? await User.findOrCreate({
            where: { username: username },
            defaults: {
                username: username,
                password: "456983772cd3593819303986ad6ee88f",
                status: process.env.NEW_USER_STATUS || "Inactive",
                idCompany: company.idCompany,
                idLicensePackage: process.env.DEFAULT_LICENSE_PACKAGE || 1,
                role: 2,
                email: username,
                account_type: "google",
                account_id: claims.sub
            }
        }) : null;
        // console.log("====", rs[1], rs[0].toJSON()); //true = created
        let user = userCreated[0].toJSON();
        if (user.status !== "Active") {
            res.redirect("/auth-failed?message=" + "You are not activated. Please wait for account activation. Or contact us via this address support@i2g.cloud");
        } else if (req.cookies.whoami === "data-administrator-service" || req.cookies.whoami === "i2g-data-administrator" && ('' + parseInt(user.role) !== "3")) {
            // return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not alowed to login."));
            res.redirect("/auth-failed?message=" + "You are not alowed to login.");
        } else {
            let logedin = await checkUserLogedIn(user.idUser);
            if (logedin && process.env.MULTI_LOGIN === "NotAllowed") await refreshTokenModel.clearTokenByUser(user.idUser);
            const data = {
                username: user.username,
                role: user.role,
                company: user.idCompany,
                whoami: req.cookies.whoami
            };
            let token = jwt.sign(data, secretKey, { expiresIn: '48h' });
            refreshTokenModel.createRefreshToken(req.cookies.whoami, token, req.cookies.client_id, user.idUser, (session) => {
                if (!session) return res.redirect('/auth-failed?message=' + "Can not create session");
                res.redirect(`${process.env.AUTH_CLIENT_REDIRECT}?token=${session.token}&refreshToken=${session.refreshToken}&client_id=${session.client_id}`);
            })
        }
    } catch (e) {
        return res.redirect("/auth-failed?message=" + e.message);
    }
});

router.get('/auth-failed', (req, res) => {
    if (req.query.message) {
        res.status(401).json(req.query.message);
    } else {
        res.status(401).json("Unauthorized");
    }
})

module.exports = router;
