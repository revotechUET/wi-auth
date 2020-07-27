module.exports = function (sequelize, DataTypes) {
    return sequelize.define('refresh_token', {
        idRefreshToken: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        refreshToken: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        expiredAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        ipaddress: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        userAgent: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        client_id: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        token: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        wi_client: {
            type: DataTypes.STRING(128),
            allowNull: true
        }
    });
};