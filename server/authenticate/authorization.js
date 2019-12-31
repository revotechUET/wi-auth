module.exports = {
    systemAdminOnly: function () {
        return function (req, res, next) {
            if (req.decoded.role < 1) {
                next();
            } else {
                return res.status(401).send({
                    code: 401,
                    success: false,
                    message: 'No permision. System admin only'
                });
            }
        }
    },
    atLeastCompanyAdmin: function() {
        return function (req, res, next) {
            if (req.decoded.role >= 1) {
                next();
            } else {
                return res.status(401).send({
                    code: 401,
                    success: false,
                    message: 'No permision. Company admin or system admin only'
                });
            }
        }
    }
};
