let models = require("../models-master/index");
let User = models.User;
let redisCLient = require('../utils/redis').redisClient;
// redisCLient.del('hoang_1:license')
// redisCLient.hmset('hoang:license', 'expiredAt', Date.now());
// redisCLient.hget('hoang:license', 'expire1', (err, result) => {
//     console.log(err, result)
// });
async function getPermFromDatabase(decoded) {
    let response = {};
    let user = await User.findOne({
        where: {username: decoded.username},
        include: {
            model: models.LicensePackage,
            include: {model: models.I2gFeature, include: {model: models.I2gApi}}
        }
    });
    let features = user.toJSON().license_package ? user.toJSON().license_package.i2g_features : [];
    for (let i = 0; i < features.length; i++) {
        let apis = features[i].i2g_apis;
        for (let j = 0; j < apis.length; j++) {
            let key = apis[j].type + "|" + apis[j].route;
            response[key] = response[key] || apis[j].i2g_feature_i2g_api.perm;
        }
    }
    return response;
}

module.exports = function (req, service) {
    return new Promise((async (resolve, reject) => {
        let decoded = req.decoded;
        if (!decoded) return resolve();
        //pass all username path, like images hoang/9a115815/4dfa42ca/ddbd0694/a4e9bdc8/52.jpg
        if(req.path.includes(decoded.username)) return resolve();
        if(new RegExp('.*.png|jpg|jpeg|gif|img|bmp|svg|pdf|webp.*', 'i').test(req.path)) return resolve();
        let requestKey = service === "WI_BACKEND" ? "BACKEND_API|" + req.path : "SERVICE|" + service;
        requestKey = requestKey.endsWith('/') ? requestKey.substring(0, requestKey.length - 1) : requestKey;
        redisCLient.hget(decoded.username + ':license', 'expiredAt', async (err, value) => {
            if (value && (Date.now() - parseInt(value)) < 1000 * 60 * 15) {
                redisCLient.hget(decoded.username + ':license', requestKey, (err, value) => {
                    // console.log("==HAS CACHE ", requestKey, value);
                    if (parseInt(value)) {
                        resolve();
                    } else {
                        reject();
                    }
                })
            } else {
                let apiPerms = await getPermFromDatabase(decoded);
                for (let key in apiPerms) {
                    redisCLient.hmset(decoded.username + ':license', key, apiPerms[key]);
                }
                redisCLient.hmset(decoded.username + ':license', 'expiredAt', Date.now());
                // console.log("==SET VALUE ", requestKey, apiPerms[requestKey]);
                if (apiPerms[requestKey]) {
                    resolve();
                } else {
                    reject();
                }
            }
        });
    }));
};