module.exports = function (sequelize, DataTypes) {
    return sequelize.define('i2g_feature', {
        idFeature: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(250),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: false
    });
};