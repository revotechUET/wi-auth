module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
        idUser: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                containsSpecialCharacter(name) {
                    //console.log("Validating:", name);
                    if (/[ `!$%^&*()+\-=\[\]{};':"\\|,<>\/?~]/.test(name)) throw new Error("Username can not contain special character");
                    // if (/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/.test(name)) throw new Error("Username can not contain special character");
                }
            }
        },
        password: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        status: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: "Inactive"
            // defaultValue: "Active"
        },
        /*
        1 : Administrator
        2 : Normal Users
         */
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: ""
        },
        fullname: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: ""
        },
        account_type: {
            type: DataTypes.ENUM("azure", "google", "i2g"),
            allowNull: true,
            defaultValue: "i2g"
        },
        account_id: {
            type: DataTypes.STRING("250"),
            allowNull: true
        },
        quota: {
            type: DataTypes.STRING('500'),
            allowNull: true,
            defaultValue: '{"project":99999,"well":99999,"dataset":99999,"curve":99999}',
            set(value) {
                this.setDataValue('quota', typeof (value) === 'object' ? JSON.stringify(value) : value);
            },
            get() {
                const value = this.getDataValue('quota');
                return JSON.parse(value);
            }
        },
    });
};