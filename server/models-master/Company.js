module.exports = function (sequelize, DataTypes) {
    return sequelize.define('company', {
        idCompany: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING(250),
            allowNull: true
        },
        location: {
            type: DataTypes.STRING(250),
            allowNull: true
        },
        licenses: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10
        }
    });
};