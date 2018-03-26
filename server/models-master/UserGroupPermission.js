module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_group_permission', {
        permission: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        }
    });
};