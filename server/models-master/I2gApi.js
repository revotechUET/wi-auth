module.exports = function (sequelize, DataTypes) {
	return sequelize.define('i2g_api', {
		idI2gApi: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(250),
			allowNull: false
		},
		value: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		type: {
			type: DataTypes.STRING(50),
			allowNull: true,
			defaultValue: "ROUTER_API"
		}
	});
};