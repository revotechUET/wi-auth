module.exports = function (sequelize, DataTypes) {
    return sequelize.define('group', {
        idGroup: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: "name-idCompany",
            validate: {
                containsSpecialCharacter(name) {
                    if (/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/.test(name)) throw new Error("Group name can not contain special character")
                }
            }
        },
        description: {
            type: DataTypes.STRING(250),
            allowNull: true
        }
    });
};