module.exports = function (sequelize, DataTypes) {
    return sequelize.define('shared_project_group', {
        permission: {
            type: DataTypes.TEXT('medium'),
            allowNull: false,
            set(value) {
                this.setDataValue('permission', typeof(value) === 'object' ? JSON.stringify(value) : value);
            },
            get() {
                const value = this.getDataValue('permission');
                return JSON.parse(value);
            }
        }
    });
};