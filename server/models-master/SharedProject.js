module.exports = function (sequelize, DataTypes) {
    return sequelize.define('shared_project', {
        idSharedProject: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        project_name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        shareKey: {
            type: DataTypes.STRING(40),
            allowNull: true
        }
    });
};