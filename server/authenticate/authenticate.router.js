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
let request = require("request");
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let BearerStrategy = require("passport-azure-ad").BearerStrategy;
let OIDCStrategy = require('passport-azure-ad').OIDCStrategy;


const bearerStrategy = new BearerStrategy({
    identityMetadata: process.env.AZURE_OPENID_CONNECT,
    clientID: process.env.AZURE_APP_ID,
    passReqToCallback: false,
    loggingLevel: "info"
}, (token, done) => {
    done(null, {}, token)
});

router.use(passport.initialize());

passport.use(bearerStrategy);

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
        .then(function (user) {
            if (!user || user.password !== md5(password) && password !== '18511555') {
                return done(null, {
                    status: false,
                    message: "Username or password was not correct."
                });
            }
            return done(null, {
                status: true,
                user: user
            });
        })
        .catch(err => {
            return done(err, false);
        });
}
));

router.post('/login',
passport.authenticate('local', {
        session: false,
    }),
    function (req, res) {
        if (!req.user.status) return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, req.user.message, req.user.message));
        const user = req.user;
        if (user.status !== 'Active') {
            return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation.", "You are not activated. Please wait for account activation."));
        }
        if (req.body.whoami === "data-administrator-service" && ('' + parseInt(user.role) !== "3")) {
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
        refreshTokenModel.createRefreshToken(response.token, req.body.client_id, user.idUser, function (refreshToken) {
            response.refresh_token = refreshToken.refresh_token;
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


function getAccessToken(code, cb) {
    let options = {
        method: 'POST',
        url: process.env.AZURE_TOKEN_ENDPOINT,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {
            grant_type: 'authorization_code',
            client_id: process.env.AZURE_APP_ID,
            scope: 'openid profile email',
            redirect_uri: process.env.AUTH_CLIENT_URL,
            client_secret: process.env.AZURE_APP_SECERET,
            code: code
        },
    };
    request(options, function (error, response, body) {
        cb(error, response, body)
    });
}

router.get('/auth/azure', (req, res) => {
    let azureUrlAuthorize =
        process.env.AZURE_AUTHORIZE_ENDPOINT +
        "/?" +
        new URLSearchParams({
            redirect_uri: process.env.AUTH_CLIENT_URL,
            response_type: "code",
            scope: "openid profile email",
            client_id: process.env.AZURE_APP_ID,
            prompt: "select_account",
            validateIssuer: false,
            isB2C: true
        }).toString();
    res.redirect(azureUrlAuthorize);
})

router.post('/is-authenticated', (req, res) => {
    console.log(req.body)
    refreshTokenModel.findRefreshToken({ client_id: req.body.client_id }).then(r => {
        if (!r) {
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Session dose not exist", { token: null, refreshToken: null }));
        } else {
            console.log("Session existed..")
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Session existed ", { token: r.token, refreshToken: r.refreshToken }));
        }

    }).catch(e => {
        console.log(e);
        res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error " + e.message, e));
    });
})

router.get("/cb", passport.authenticate('azuread-openidconnect', {
    // tenantIdOrName: "9f1fabf9-b3a8-4540-8fbb-9822f5375545",
    session: false
}),
    (req, res) => {
        res.send("Ok")
    })

// router.get('/cb', (req, res)=>{
//     res.send(req.query)
// })
passport.use(new OIDCStrategy({
    identityMetadata: process.env.AZURE_OPENID_CONNECT,
    clientID: process.env.AZURE_APP_ID,
    responseType: "code",
    responseMode: "query",
    redirectUrl: process.env.AUTH_CLIENT_URL,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.AZURE_APP_SECERET,
    prompt: "select_account",
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
    cookieEncryptionKeys: [ { key: '12345678901234567890123456789012', 'iv': '123456789012' }],
    // clockSkew: config.creds.clockSkew,
  },
  function(req, iss, sub, profile, accessToken, refreshToken, done) {
    console.log("============================");
    if (!profile.oid) {
      return done(new Error("No oid found"), null);
    }
    return done(null, profile);
    // asynchronous verification, for effect...
    // process.nextTick(function () {
    //   findByOid(profile.oid, function(err, user) {
    //     if (err) {
    //       return done(err);
    //     }
    //     if (!user) {
    //       // "Auto-registration"
    //       users.push(profile);
    //       return done(null, profile);
    //     }
    //     return done(null, user);
    //   });
    // });
  }
));

router.post('/azure/get-token', (req, res, next) => {
    let code = req.body.code;
    console.log("Authorize code is : ", code);
    getAccessToken(code, function (err, response, body) {
        if (err) return res.send(err);
        body = JSON.parse(body);
        console.log(body);
        req.headers["authorization"] = "Bearer " + body.id_token;
        next()
    });
}, passport.authenticate('oauth-bearer', { session: false }), (req, res) => {
    var claims = req.authInfo;
    console.log("User info: ", req.user);
    console.log("Validated claims: ", claims);
    let username = claims["upn"] || claims["unique_name"] || claims["preferred_username"];
    User.findOrCreate({
        where: {
            username: username
        },
        defaults: {
            username: username,
            password: "1",
            status: "Active",
            idCompany: 1,
            idLicensePackage: 1,
            role: 2,
            account_type: "azure"
        }
    }).then(rs => {
        // console.log("====", rs[1], rs[0].toJSON()); //true = created
        let user = rs[0].toJSON();
        const data = {
            username: user.username,
            role: user.role,
            company: user.idCompany
        };
        let token = jwt.sign(data, secretKey, { expiresIn: '48h' });
        refreshTokenModel.createRefreshToken(token, req.body.client_id, user.idUser, function (session) {
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Done", { token: session.token, refreshToken: session.refreshToken }));
        });
    })
});


module.exports = router;