module.exports = function (sequelize, DataTypes) {
    return sequelize.define('i2g_api', {
        idI2gApi: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        route: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: "BACKEND_API"
        }
    }, {
        timestamps: false
    });
};