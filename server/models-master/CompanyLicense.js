module.exports = function (sequelize, DataTypes) {
    return sequelize.define('company_license', {
        value: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: false
    });
};