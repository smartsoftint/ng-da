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
		"id": rolesArg.id,
		"description": rolesArg.description,
		"permissions": rolesArg.permissions
	});
}

exports.get = function(req, res) {
	var rolesList = [];
	var rolesResult = [];
	var permissionsList = [];

    async.series([
		function(callback) {
			dataAccess.RolesModel.find({}, function (err, roles) {
				if(err) return callback(err);

				if(roles == null || roles.length == 0) return callback();

				rolesList = roles;
		        callback();
    		});
		},
        function(callback) {
        	dataAccess.PermissionsModel.find({}, function(err, permissions) {
        		if (err) return callback(err);

        		fullPermissions = permissions;
        		callback();
        	});
        }, 
        function(callback) {
        	rolesList.forEach(function(role) {
        		var roleElement = {};
        		roleElement.id = role.id;
        		roleElement.description = role.description;
        		roleElement.permissions = [];
        		role.permissions.forEach(function(permissionRole) {
        			var permissionElement = {};
        			permissionElement.func = permissionRole.func;
        			permissionElement.actions = permissionRole.actions;
        			permissionElement.url = "";
        			permissionElement.text = "";
	        		for(var i = 0;  i < fullPermissions.length; i++) {
	        			if(permissionRole.func == fullPermissions[i].func) {
	        				permissionElement.url = fullPermissions[i].url;
	        				permissionElement.text = fullPermissions[i].text;
	        				break;
	        			}
	        		}
	        		roleElement.permissions.push(permissionElement);
	        	});
	        	rolesResult.push(roleElement);
        	});
        	callback();
        }
	], function(err) {
		res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", rolesResult, "")));
    });
};

exports.post = function(req, res) {
	var rolesArg = JSON.parse(JSON.stringify(req.body));
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
	var rolesArg = JSON.parse(JSON.stringify(req.body));
	var hasErrors = false;
	var errors = [];
	var roleNumber = 0;

	if(rolesArg.length > 0) {
		async.each(rolesArg,
			function(roleEl, callback) {
				roleNumber++;
				roleEl.id = "R-" + roleNumber + new Date().getTime();
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
		res.json(utils.defineResult("200", "OK", "", ""));
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

	async.series([
        function(callback) {
            dataAccess.RolesModel.findOne({id : roleArg}, function(err, role) {
                if (err) return callback(err);

                if (role == null)return callback(new Error(notFound));
                
                roleDB = rawRole(role);
                roleRaw = role;

                role.permissions.forEach(function(permission) {
				    rolePermissionsIds.push(permission.func);
				});
                callback();
            });
        },
        function(callback) {
        	if(roleRaw.permissions.length > 0) {
        		dataAccess.PermissionsModel.find({}).where('func').in(rolePermissionsIds).exec(function(err, permissions) {
	        		if (err) return callback(err);

	        		roleRaw.permissions.forEach(function(permission) {
	        			for(var i = 0; i < permissions.length; i++) {
	        				if(permission.func == permissions[i].func) {
	        					var perm = {};
	        					perm.func = permission.func;
	        					perm.actions = permission.actions;
	        					perm.url = permissions[i].url;
	        					perm.text = permissions[i].text;
	        					rolePermissions.push(perm);
	        					break;
	        				}
	        			}
					});
					roleDB.permissions = rolePermissions;
					console.log(roleDB);
					callback();
	        	});
        	}
        }
    ], function(err) {
    	res.json(((err) ? utils.defineResult("", "ERROR", "", ((err.message == notFound) ? notFound : err)) : utils.defineResult("200", "OK", roleDB, "")));
    });
};

exports.postRole = function(req, res) {
	console.log('Post Roles by id');
	var roleArg = JSON.parse(JSON.stringify(req.body));

	async.series([
        function(callback) {
            var roleToAdd = newRol(roleArg);	
			var roleToAddObj = roleToAdd.toObject();
			delete roleToAddObj._id;
			//dataAccess.RolesModel.update({id: roleToAdd.id}, roleToAddObj, {upsert: true}, function(err, roleToAdd) {
			dataAccess.RolesModel.update({description: roleToAdd.description}, roleToAddObj, {upsert: true}, function(err, roleToAdd) {
				if (err) return callback(err);

				callback();
			});
        }
    ], function(err) {
    	res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.deleteRole = function(req, res) {
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