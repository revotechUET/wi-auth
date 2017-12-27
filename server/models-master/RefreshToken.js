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
        }
    });
};