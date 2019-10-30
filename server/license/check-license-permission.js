let models = require("../models-master/index");
let User = models.User;
module.exports = function (req, service) {
    return new Promise((async (resolve, reject) => {
        let decoded = req.decoded;
        console.log(service, req.path)
        let user = await User.findOne({where: {username: decoded.username}});
        // console.log(user.toJSON());
        resolve()
    }));
};