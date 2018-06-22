const rule = require('./rule.json');

const middleware = () => (req, res, next) => {

    const token = req.decoded;

    // no-token but pass authenticate
    // => path is in EXCEPTION_PATH
    // => next
    if (!token) return next();

    const basePath = req.path.split('/')[1];
    const { role } = token;
    const allowedRole = rule[basePath];

    if (isAllowedRole(role, allowedRole)) return next();

    return res.status(401).json({
        code: 401,
        success: false,
        message: 'This user is not allowed to use this method'
    })
}

function isAllowedRole(role, allowedRole) {
    return role <= allowedRole;
}

module.exports = middleware;