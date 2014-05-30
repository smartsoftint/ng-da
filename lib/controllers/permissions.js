var dataAccess = require('../schemas/schemas');
var async = require('async');
var utils = require('../utils');

var roleNotFound = "Role not found";
var userNotFound = "User not found";
var withoutPermissions = "No permissions created";
var duplicatePermissions = "Duplicate permissions";

var resultado = {
	result : "",
	exception : []
}

var defineNewRole = function(newRole) {
	return new dataAccess.RolesModel({
		"id": newRole.id,
		"description": newRole.description,
		"permissions": newRole.permissions
	});
}

var defineNewUserPermissions = function(newUserPermissions) {
    return new dataAccess.UsersPermissionsModel({
        "id": newUserPermissions.id,
        "permissions": newUserPermissions.permissions
    });
}

exports.getFullPermissions = function(req, res) {
    dataAccess.PermissionsModel.find({}, function(errP, permissions) {
        if(errP || permissions == null || permissions.length == 0) {
            res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : errP.message)));
        } else {
            res.json(utils.defineResult("200", "OK", permissions, ""));
        }
    });
};

exports.getPermissionsPerRole = function(req, res) {
	var roleId = req.params.id;
	var permissionsList = [];

	dataAccess.PermissionsModel.find({}, function(errP, permissions) {
		if(errP || permissions == null || permissions.length == 0) {
            res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : errP.message)));
		} else {
			dataAccess.RolesModel.findOne({id : roleId}, function(errR, roleInfo) {	
				if(errR || roleInfo == null) {
                    res.json(utils.defineResult("", "ERROR", "", ((roleInfo == null) ? roleNotFound : errR.message)));
				} else {
					for(var i = 0; i < roleInfo.permissions.length; i++) {
						var permissionElement = {};
						for(var j = 0; j < permissions.length; j++) {
							if(roleInfo.permissions[i].func == permissions[j].func) {
								permissionElement.func = roleInfo.permissions[i].func;
								permissionElement.url = permissions[j].url;
                                permissionElement.text = permissions[j].text;
								permissionElement.actions = roleInfo.permissions[i].actions;
								permissionsList.push(permissionElement);
								break;
							}
						}
					}
                    res.json(utils.defineResult("200", "OK", permissionsList, ""));
				}
			});
		}
	});
};

exports.postPermissionsPerRole = function(req, res) {
	var roleId = req.params.id;
	var permissionsArg = JSON.parse(JSON.stringify(req.body));
	var roleToModify = null;
	var newRole = {};

	async.series([
        function(callback) {
        	dataAccess.RolesModel.findOne({id : roleId}, function(errR, roleInfo) {
        		if(errR) return callback(errR);

        		if(roleInfo == null) return callback(roleNotFound);

        		roleToModify = roleInfo;
        		callback();
        	});
        },
        function(callback) {
        	newRole.id = roleToModify.id;
        	newRole.description = roleToModify.description;
        	newRole.permissions = permissionsArg;

        	roleToModify.permissions.forEach(function(permission) {
        		var exist = false;
        		for(var i = 0; i < permissionsArg.length; i++) {
        			if(permission.func == permissionsArg[i].func) {
        				exist = true;
        				break;
        			}
        		}
        		if(!exist) newRole.permissions.push(permission);
        	});
        	callback();
        },
        function(callback) {
        	var roleToAdd = defineNewRole(newRole);	
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

exports.putPermissionsPerRole = function(req, res) {
    var roleId = req.params.id;
    var permissionsArg = JSON.parse(JSON.stringify(req.body));
    var roleToModify = null;
    var newRole = {};

    async.series([
        function(callback) {
            dataAccess.RolesModel.findOne({id : roleId}, function(errR, roleInfo) {
                if(errR) return callback(errR);

                if(roleInfo == null) return callback(roleNotFound);

                roleToModify = roleInfo;
                callback();
            });
        },
        function(callback) {
            newRole.id = roleToModify.id;
            newRole.description = roleToModify.description;
            newRole.permissions = roleToModify.permissions;

            var hasDuplicates = false;
            for(var i = 0; i < permissionsArg.length; i++) {
                var exist = false;
                for(var j = 0; j < roleToModify.permissions.length; j++) {
                    if(roleToModify.permissions[j].func == permissionsArg[i].func) {
                        exist = true;
                        break;
                    }
                }

                if(exist) {
                    hasDuplicates = true;
                    break;
                } else {
                    newRole.permissions.push(permissionsArg[i]);
                }
            }

            if(hasDuplicates) return callback(duplicatePermissions);

            callback();
        },
        function(callback) {
            var roleToAdd = defineNewRole(newRole); 
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

exports.deletePermissionsPerRole = function(req, res) {
	var roleId = req.params.id;
	var permissionsArg = JSON.parse(JSON.stringify(req.body));
	var roleToModify = null;
	var newRole = {};

	async.series([
        function(callback) {
        	dataAccess.RolesModel.findOne({id : roleId}, function(errR, roleInfo) {
        		if(errR) return callback(errR);

        		if(roleInfo == null) return callback(roleNotFound);

        		roleToModify = roleInfo;
        		callback();
        	});
        },
        function(callback) {
        	newRole.id = roleToModify.id;
        	newRole.description = roleToModify.description;
        	newRole.permissions = [];

        	roleToModify.permissions.forEach(function(permission) {
        		var deletePermission = false;
        		for(var i = 0; i < permissionsArg.length; i++) {
        			if(permission.func == permissionsArg[i]) {
        				deletePermission = true;
        				break;
        			}
        		}
        		if(!deletePermission) newRole.permissions.push(permission);
        	});
        	callback();
        },
        function(callback) {
        	var roleToAdd = defineNewRole(newRole);	
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

exports.getPermissionsPerUser = function(req, res) {
    var userId = req.params.id;
    var permissionsList = [];

    dataAccess.PermissionsModel.find({}, function(errP, permissions) {
        if(errP || permissions == null || permissions.length == 0) {
            res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : errP)));
        } else {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(errU, userPermInfo) { 
                if(errU) {
                    res.json(utils.defineResult("", "ERROR", "", errU));
                } else if(userPermInfo == null) {
                    res.json(utils.defineResult("200", "OK", [], ""));
                } else {
                    for(var i = 0; i < userPermInfo.permissions.length; i++) {
                        var permissionElement = {};
                        for(var j = 0; j < permissions.length; j++) {
                            if(userPermInfo.permissions[i].func == permissions[j].func) {
                                permissionElement.func = userPermInfo.permissions[i].func;
                                permissionElement.url = permissions[j].url;
                                permissionElement.text = permissions[j].text;
                                permissionElement.actions = userPermInfo.permissions[i].actions;
                                permissionsList.push(permissionElement);
                                break;
                            }
                        }
                    }
                    res.json(utils.defineResult("200", "OK", permissionsList, ""));
                }
            });
        }
    });
};

exports.postPermissionsPerUser = function(req, res) {
    var userId = req.params.id;
    var permissionsArg = JSON.parse(JSON.stringify(req.body));
    var userPermsToModify = null;
    var newUserPermissions = {};
    var create = false;

    async.series([
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, userPermsInfo) {
                if(err) return callback(err);

                if(userPermsInfo == null) create = true;

                userPermsToModify = userPermsInfo;
                callback();
            });
        },
        function(callback) {
            newUserPermissions.id = create ? userId : userPermsToModify.id;
            newUserPermissions.permissions = permissionsArg;

            if(!create) {
                userPermsToModify.permissions.forEach(function(permission) {
                    var exist = false;
                    for(var i = 0; i < permissionsArg.length; i++) {
                        if(permission.func == permissionsArg[i].func) {
                            exist = true;
                            break;
                        }
                    }
                    if(!exist) newUserPermissions.permissions.push(permission);
                });
            }
            callback();
        },
        function(callback) {
            var userPermsToAdd = defineNewUserPermissions(newUserPermissions); 
            var userPermsToAddObj = userPermsToAdd.toObject();
            delete userPermsToAddObj._id;
            dataAccess.UsersPermissionsModel.update({id: userPermsToAdd.id}, userPermsToAddObj, {upsert: true}, function(err, userPermsToAdd) {
                if (err) return callback(err);

                callback();
            });
        }
    ], function(err) {
        res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.putPermissionsPerUser = function(req, res) {
    var userId = req.params.id;
    var permissionsArg = JSON.parse(JSON.stringify(req.body));
    var userPermsToModify = null;
    var newUserPermissions = {};
    var create =  false;

    async.series([
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, userPermsInfo) {
                if(err) return callback(err);

                if(userPermsInfo == null) create = true;

                userPermsToModify = userPermsInfo;
                callback();
            });
        },
        function(callback) {
            newUserPermissions.id = create ? userId : userPermsToModify.id;
            newUserPermissions.permissions = [];
            userPermsToModify.permissions.forEach(function(permArg) {
                newUserPermissions.permissions.push(permArg);
            });

            if(!create) {           
                var hasDuplicates = false;
                for(var i = 0; i < permissionsArg.length; i++) {
                    var exist = false;
                    for(var j = 0; j < userPermsToModify.permissions.length; j++) {
                        if(userPermsToModify.permissions[j].func == permissionsArg[i].func) {
                            exist = true;
                            break;
                        }
                    }

                    if(exist) {
                        hasDuplicates = true;
                        break;
                    } else {
                        newUserPermissions.permissions.push(permissionsArg[i]);
                    }
                }

                if(hasDuplicates) return callback(duplicatePermissions);
            }

            callback();
        },
        function(callback) {
            var userPermsToAdd = defineNewUserPermissions(newUserPermissions); 
            var userPermsToAddObj = userPermsToAdd.toObject();
            delete userPermsToAddObj._id;
            dataAccess.UsersPermissionsModel.update({id: userPermsToAdd.id}, userPermsToAddObj, {upsert: true}, function(err, userPermsToAdd) {
                if (err) return callback(err);

                callback();
            });
        }
    ], function(err) {
        res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.deletePermissionsPerUser = function(req, res) {
    var userId = req.params.id;
    var permissionsArg = JSON.parse(JSON.stringify(req.body));
    var userPermsToModify = null;
    var newUserPermissions = {};

    async.series([
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, userPermsInfo) {
                if(err) return callback(err);

                if(userPermsInfo == null) return callback(userNotFound);

                userPermsToModify = userPermsInfo;
                callback();
            });
        },
        function(callback) {
            newUserPermissions.id = userPermsToModify.id;
            newUserPermissions.permissions = [];

            userPermsToModify.permissions.forEach(function(permission) {
                var deletePermission = false;
                for(var i = 0; i < permissionsArg.length; i++) {
                    if(permission.func == permissionsArg[i]) {
                        deletePermission = true;
                        break;
                    }
                }
                if(!deletePermission) newUserPermissions.permissions.push(permission);
            });
            callback();
        },
        function(callback) {
            var userPermsToAdd = defineNewUserPermissions(newUserPermissions); 
            var userPermsToAddObj = userPermsToAdd.toObject();
            delete userPermsToAddObj._id;
            dataAccess.UsersPermissionsModel.update({id: userPermsToAdd.id}, userPermsToAddObj, {upsert: true}, function(err, userPermsToAdd) {
                if (err) return callback(err);

                callback();
            });
        }
    ], function(err) {
        res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.getAllPermissions = function(req, res) {
    console.log("getAllPermissions");

/*
    dataAccess.PermissionsModel.find({}, function(errP, permissions) {
        if(errP || permissions == null || permissions.length == 0) {
            res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : errP)));
        } else {
            console.log("Permissions");
            res.json(utils.defineResult("200", "OK", permissions, ""));
        }
    });
*/

    var permissionsList = [];
    var permissionsResult = [];


    async.series([
        function(callback) {
            dataAccess.PermissionsModel.find({}, function(err, permissions) {
                if (err) return callback(err);

                if(permissions == null || permissions.length == 0) return callback();

                permissionsList = permissions;
                //console.log("getAllPermissions" + permissionsList);
                callback();
            });
        },
    ], function(err) {
        if (err) {
            res.send(utils.defineResult("", "ERROR", "", ((err.message == notFound) ? notFound : err)));
        } else {
            //utils.defineResult("200", "OK", permissionsList, "")
            res.json(permissionsList);
        }
    });
};
