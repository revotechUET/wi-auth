module.exports = function (sequelize, DataTypes) {
    return sequelize.define('i2g_feature_i2g_api', {
        perm: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: false
    });
};