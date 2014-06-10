var dataAccess = require('../schemas/schemas');
var async = require('async');
var utils = require('../utils');

var notFound = 'Role not found';
var usedRoleError = 'The Role is being used';

var resultado = {
	result : "",
	exception : []
}

var roleObj = {
	id: "",
	description: "",
	permissions: []
}

var rawRole = function(roleDB) {
	roleObj.id = roleDB.id;
	roleObj.description = roleDB.description;
	roleObj.permissions = [];
	return roleObj;
}

var newRol = function(rolesArg) {
	return new dataAccess.RolesModel({
		"id": ("id" in rolesArg) ? rolesArg.id : "R-" + new Date().getTime(),
		"description": rolesArg.description,
		"permissions": rolesArg.permissions
	});
}

exports.get = function(req, res) {
	var rolesList = [];
	var rolesResult = [];
	var permissionsList = [];

	dataAccess.RolesModel.find({}, function (err, roles) {
		if(err) res.json(utils.defineResult("", "ERROR", "", err));

		if(roles == null || roles.length == 0) res.json(utils.defineResult("200", "OK", [], ""));

		res.json(utils.defineResult("200", "OK", roles, ""));
	});
};

exports.post = function(req, res) {
	var rolesArg = [JSON.parse(JSON.stringify(req.body))];
	console.log("Roles post " + JSON.stringify(rolesArg));
	var hasErrors = false;
	var errors = [];

	if(rolesArg.length > 0) {
		async.each(rolesArg,
			function(roleEl, callback) {
				var roleToAdd = newRol(roleEl);	
				var roleToAddObj = roleToAdd.toObject();
				delete roleToAddObj._id;
				dataAccess.RolesModel.update({description: roleToAdd.description}, roleToAddObj, {upsert: true}, function(err, roleToAdd) {
					if (err) {
			  			hasErrors = true;
			  			errors.push(err);
			  		}
					callback();
				});
			},
			function(err) {
				res.json(((hasErrors) ? utils.defineResult("", "ERROR", "", errors) : utils.defineResult("200", "OK", "", "")));
			}
		);
	} else {
		res.json(utils.defineResult("200", "OK", "", ""));
	}
};

exports.put = function(req, res) {
	var rolesArg = [JSON.parse(JSON.stringify(req.body))];
	var hasErrors = false;
	var errors = [];
	var roleNumber = 0;
	var idRol = "";

	if(rolesArg.length > 0) {
		async.each(rolesArg,
			function(roleEl, callback) {
				roleNumber++;
				idRol = "R-" + roleNumber + new Date().getTime();
				roleEl.id =  idRol;
				var roleToAdd = newRol(roleEl);
				roleToAdd.save(function(err, roleToAdd) {
					if (err) {
			  			hasErrors = true;
			  			errors.push(err);
			  		}
					callback();
				});
			},
			function(err) {
				res.json(((hasErrors) ? utils.defineResult("", "ERROR", "", errors) : utils.defineResult("200", "OK", "", "")));
			}
		);
	} else {
		res.json(utils.defineResult("200", "OK", idRol, ""));
	}
}


exports.delete = function(req, res) {
	var rolesArg = JSON.parse(JSON.stringify(req.body));
	var hasErrors = false;
	var errors = [];
	var unused = [];
	var used = [];

	if(rolesArg.length > 0) {
		async.series([
			function(callback) {
				dataAccess.UsersRolesModel.find({}, function (err, userRoles) {
			        if (err || userRoles == null)  return callback();
		        
		        	for(var k = 0;  k < rolesArg.length; k++) {
		        		var exist = false;
				        for(var i = 0;  i < userRoles.length; i++) {
				        	var userRole = userRoles[i];				        	
				        	for(var j = 0;  j < userRole.roles.length; j++) {
				        		if(userRole.roles[j] == rolesArg[k]) {
			            			exist = true;
			            			break;
			            		}
				        	}
				        	if(exist) break;
				        }
				        if(!exist) unused.push(rolesArg[k]);
				        else used.push(rolesArg[k]);
				    }        				        
		            callback();
			    });
			},
			function(callback) {
				async.each(unused,
					function(roleEl, callbackre) {
						var roleToDel = roleEl;
						dataAccess.RolesModel.remove({id: roleToDel }, function(err, roleToDel) {
							if (err) {
					  			hasErrors = true;
					  			errors.push(err);
					  		}
							callbackre();
						});
					},
					function(err) {
					}
				);
				callback();
			}
		], function(err) {
			res.json(((err || hasErrors) ? utils.defineResult("", "ERROR", "", (hasErrors ? errors : err)) : utils.defineResult("200", "OK", "", "")));
	    });
	} else {
		res.json(utils.defineResult("200", "OK", "", ""));
	}
}

exports.getRole = function(req, res) {
	var roleArg = req.params.id;
	var roleDB = {};
	var rolePermissionsIds = [];
	var rolePermissions = [];
	var roleRaw;

	dataAccess.RolesModel.findOne({id : roleArg}, function(err, role) {
        if (err) res.json(utils.defineResult("", "ERROR", "", err));

        if (role == null) res.json(utils.defineResult("", "ERROR", "", notFound));

        res.json(utils.defineResult("200", "OK", role, ""));
    });
};

exports.postRole = function(req, res) {
	var roleArg = JSON.parse(JSON.stringify(req.body));

	async.series([
        function(callback) {
            var roleToAdd = newRol(roleArg);	
			var roleToAddObj = roleToAdd.toObject();
			delete roleToAddObj._id;
			dataAccess.RolesModel.update({id: roleToAdd.id}, roleToAddObj, {upsert: true}, function(err, roleToAdd) {
			//dataAccess.RolesModel.update({description: roleToAdd.description}, roleToAddObj, {upsert: true}, function(err, roleToAdd) {
				if (err) return callback(err);

				callback();
			});
        }
    ], function(err) {
    	res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.deleteRole = function(req, res) {
	console.log("Delete rol " + req);
	var roleToDel = req.params.id;
	var used = false;

	async.series([
		function(callback) {
			dataAccess.UsersRolesModel.find({}, function (err, userRoles) {
		        if (err || userRoles == null)  return callback();
	        
		        for(var i = 0;  i < userRoles.length; i++) {
		        	var userRole = userRoles[i];
		        	for(var j = 0;  j < userRole.roles.length; j++) {
		        		if(userRole.roles[j] == roleToDel) {
	            			used = true;
	            			break;
	            		}
		        	}
		        	if(used) break;
		        }		        				        
	            callback();
		    });
		},
		function(callback) {
			if (used) return callback(usedRoleError);

			dataAccess.RolesModel.remove({id: roleToDel }, function(err, roleToDel) {
		  		if (err) return callback(err);

		  		callback();
			});
		}
	], function(err) {
		res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};