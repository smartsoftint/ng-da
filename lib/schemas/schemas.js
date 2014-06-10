var mongoose = require('mongoose');
//mongoose.connect("mongodb://lmatamoros:Passw0rd@ds043047.mongolab.com:43047/bidata");
//mongoose.connect("mongodb://localhost:27017/seguridadNG2");
mongoose.connect("mongodb://admin:admin1@ds053178.mongolab.com:53178/ngv2");

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Users  = new Schema({
	id : String,
	identification : String,
	name : String,
	lastName : String,
	surName : String,
	email : String,
	address : String,
	user : String,
	password : String
}, { collection : 'Users' });

/*
var Users  = new Schema({
	id : String,
	identification : String,
	name : String,
	email : String,
	address : String,
	user : String,
	password : String
}, { collection : 'Users' });*/

var Permissions  = new Schema({
	func : String,
	text : String,
	url : String,
	actions : [Schema.Types.Mixed]
}, { collection : 'Permissions' });

var Roles  = new Schema({
	id : String,
	description : String,
	permissions : [Schema.Types.Mixed]
}, { collection : 'Roles' });

var UsersRoles  = new Schema({
	id : String,
	roles : [String]
}, { collection : 'UsersRoles' });

var UsersPermissions  = new Schema({
	id : String,
	permissions : [Schema.Types.Mixed]
}, { collection : 'UsersPermissions' });

var Sessions  = new Schema({
	id : String,
	expires : String,
	expirationDate : Number,
	status : String,
	user : String
}, { collection : 'Sessions' });

var newObjectId = function() {
	return mongoose.Types.ObjectId();
}

var UsersModel = mongoose.model('Users', Users);
var PermissionsModel = mongoose.model('Permissions', Permissions);
var RolesModel = mongoose.model('Roles', Roles);
var UsersRolesModel = mongoose.model('UsersRoles', UsersRoles);
var UsersPermissionsModel = mongoose.model('UsersPermissions', UsersPermissions);
var SessionsModel = mongoose.model('Sessions', Sessions);

module.exports.UsersModel = UsersModel;
module.exports.PermissionsModel = PermissionsModel;
module.exports.RolesModel = RolesModel;
module.exports.UsersRolesModel = UsersRolesModel;
module.exports.UsersPermissionsModel = UsersPermissionsModel;
module.exports.SessionsModel = SessionsModel;
//Funciones
module.exports.newObjectId = newObjectId;