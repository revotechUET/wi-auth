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
            unique: true,
            validate: {
                containsSpecialCharacter(name) {
                    if (/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/.test(name)) throw new Error("Company name can not contain special character")
                }
            }
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
        },
        storage_location: {
            type: DataTypes.STRING(250),
            allowNull: false,
            defaultValue: ""
        },
        shortname: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        domains: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: "[]"
        },
        taxonomies: {
            type: DataTypes.TEXT('medium'),
			allowNull: true,
			set(value) {
				this.setDataValue('taxonomies', typeof(value) === 'object' ? JSON.stringify(value) : value);
			},
			get() {
				const value = this.getDataValue('taxonomies');
				return JSON.parse(value);
			}
        }
    });
};