let Sequelize = require('sequelize');
let config = require('config').Database;


const sequelize = new Sequelize(process.env.AUTH_DBNAME || config.dbName, process.env.AUTH_DBUSER || config.user, process.env.AUTH_DBPASSWORD || config.password, {
	host: process.env.AUTH_DBHOST || config.host,
	define: {
		freezeTableName: true
	},
	dialect: process.env.AUTH_DBDIALECT || config.dialect,
	port: process.env.AUTH_DBPORT || config.port,
	logging: process.env.AUTH_DBLOGGING || config.logging,
	pool: {
		max: 20,
		min: 0,
		idle: 200
	},
	storage: process.env.AUTH_DBSTORAGE || config.storage,
	operatorsAliases: Sequelize.Op
});
sequelize.sync()
	.catch(function (err) {
		console.log(err);
	});
let models = [
	'Company',
	'Group',
	'RefreshToken',
	'SharedProject',
	'SharedProjectGroup',
	'User',
	'UserGroupPermission',
	'UserLanguage'
];
models.forEach(function (model) {
	module.exports[model] = sequelize.import(__dirname + '/' + model);
});

(function (m) {
	m.User.hasMany(m.RefreshToken, {foreignKey: {name: 'idUser', allowNull: false}, onDelete: 'CASCADE'});
	m.User.hasMany(m.SharedProject, {foreignKey: {name: 'idOwner', allowNull: false}, onDelete: 'CASCADE'});
	m.SharedProject.belongsTo(m.User, {foreignKey: {name: 'idOwner', allowNull: false}, onDelete: 'CASCADE'});
	m.Company.hasMany(m.Group, {
		foreignKey: {name: 'idCompany', allowNull: false, unique: "name-idCompany"},
		onDelete: 'CASCADE'
	});
	m.Group.belongsTo(m.Company, {foreignKey: {name: 'idCompany', allowNull: false}});
	m.Company.hasMany(m.User, {foreignKey: {name: 'idCompany', allowNull: false}, onDelete: 'CASCADE'});
	m.User.belongsTo(m.Company, {foreignKey: {name: 'idCompany', allowNull: false}, onDelete: 'CASCADE'});
	m.User.belongsToMany(m.Group, {
		through: m.UserGroupPermission,
		foreignKey: 'idUser'
	});
	m.Group.belongsToMany(m.User, {
		through: m.UserGroupPermission,
		foreignKey: 'idGroup'
	});
	m.SharedProject.belongsToMany(m.Group, {
		through: 'shared_project_group',
		foreignKey: 'idSharedProject'
	});
	m.Group.belongsToMany(m.SharedProject, {
		through: 'shared_project_group',
		foreignKey: 'idSharedProject'
	});
	m.Group.belongsToMany(m.SharedProject, {
		through: 'shared_project_group',
		foreignKey: 'idGroup'
	});
	///user.addGroup(group, {through: {permission: 5});
})(module.exports);
module.exports.sequelize = sequelize;
