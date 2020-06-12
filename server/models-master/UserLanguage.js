module.exports = function (sequelize, DataTypes) {
	return sequelize.define('user_language', {
		key: {
			type: DataTypes.STRING(10),
			allowNull: false,
			primaryKey: true
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true,
			set(value) {
				this.setDataValue('content', typeof(value) === 'object' ? JSON.stringify(value) : value);
			},
			get() {
				const value = this.getDataValue('content');
				return JSON.parse(value);
			}
		}
	});
};