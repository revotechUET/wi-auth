module.exports = function (sequelize, DataTypes) {
	return sequelize.define('license_package', {
		idLicensePackage: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING(250),
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	});
};