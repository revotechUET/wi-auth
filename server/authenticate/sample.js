// APP_URL=localhost:2999
// PORT=2999
// APPVERSION=1.0.0

// AZURE_APP_ID=4d9390c5-a974-4026-ad7e-d311f2c93e86
// AZURE_APP_SECERET=h~OH.i48I~PjF5oT7p76Uv8k.US5W-J3Qc
// AZURE_TOKEN_ENDPOINT=https://login.microsoftonline.com/common/oauth2/v2.0/token
// AZURE_AUTHORIZE_ENDPOINT=https://login.microsoftonline.com/common/oauth2/v2.0/authorize
// AZURE_REDIRECT_URI=http://localhost:8080/redirect
// AZURE_OPENID_CONNECT=https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration

// AUTH_CLIENT_URL=http://localhost:2999/login-azure
// WI_BACKEND=localhost:3001

// let BearerStrategy = require("passport-azure-ad").BearerStrategy;
// const bearerStrategy = new BearerStrategy({
//     identityMetadata: process.env.AZURE_OPENID_CONNECT,
//     clientID: process.env.AZURE_APP_ID,
//     passReqToCallback: false,
//     loggingLevel: "info"
// }, (token, done) => {
//     done(null, {}, token)
// });
// router.post('/azure/get-token', (req, res, next) => {
//     let code = req.body.code;
//     console.log("Authorize code is : ", code);
//     getAccessToken(code, function (err, response, body) {
//         if (err) return res.send(err);
//         body = JSON.parse(body);
//         console.log(body);
//         req.headers["authorization"] = "Bearer " + body.id_token;
//         next()
//     });
// }, passport.authenticate('oauth-bearer', { session: false }), (req, res) => {
//     var claims = req.authInfo;
//     console.log("User info: ", req.user);
//     console.log("Validated claims: ", claims);
//     let username = claims["upn"] || claims["unique_name"] || claims["preferred_username"];
//     User.findOrCreate({
//         where: {
//             username: username
//         },
//         defaults: {
//             username: username,
//             password: "1",
//             status: "Active",
//             idCompany: 1,
//             idLicensePackage: 1,
//             role: 2,
//             account_type: "azure"
//         }
//     }).then(rs => {
//         // console.log("====", rs[1], rs[0].toJSON()); //true = created
//         let user = rs[0].toJSON();
//         const data = {
//             username: user.username,
//             role: user.role,
//             company: user.idCompany
//         };
//         let token = jwt.sign(data, secretKey, { expiresIn: '48h' });
//         refreshTokenModel.createRefreshToken(token, req.body.client_id, user.idUser, function (session) {
//             res.send(ResponseJSON(ErrorCodes.SUCCESS, "Done", { token: session.token, refreshToken: session.refreshToken }));
//         });
//     })
// });


// router.get('/auth/azure', (req, res) => {
//     let azureUrlAuthorize =
//         process.env.AZURE_AUTHORIZE_ENDPOINT +
//         "/?" +
//         new URLSearchParams({
//             redirect_uri: process.env.AUTH_CLIENT_URL,
//             response_type: "code",
//             scope: "openid profile email",
//             client_id: process.env.AZURE_APP_ID,
//             prompt: "select_account",
//             validateIssuer: false,
//             // isB2C: false,
//             issuer: "https://sts.windows.net/9f1fabf9-b3a8-4540-8fbb-9822f5375545",
//             state: "12345"
//         }).toString();
//     res.redirect(azureUrlAuthorize);
// })

// function getAccessToken(code, cb) {
//     let options = {
//         method: 'POST',
//         url: process.env.AZURE_TOKEN_ENDPOINT,
//         headers: { 'content-type': 'application/x-www-form-urlencoded' },
//         form: {
//             grant_type: 'authorization_code',
//             client_id: process.env.AZURE_APP_ID,
//             scope: 'openid profile email',
//             redirect_uri: process.env.AUTH_CLIENT_URL,
//             client_secret: process.env.AZURE_APP_SECERET,
//             code: code,
//             state: "12345"
//         },
//     };
//     request(options, function (error, response, body) {
//         cb(error, response, body)
//     });
// }