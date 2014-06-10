var dataAccess = require('../schemas/schemas');
var async = require('async');
var utils = require('../utils');
var us = require("underscore")._;

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


/****************************************************/


var permissionsPerPage = function(permissions, pageId) {
    var permissionsList = [];
    for(var i = 0; i < permissions.length; i++) {
        var permission = permissions[i];
        var encontrado = false;
        for(var j = 0; j < permission.actions.length; j++) {
            var action = permission.actions[j];
            if(action.func == pageId) {
                permissionsList = action.actions;
                encontrado = true;
                break;
            }
        }
        if (encontrado) break;
    }
    return permissionsList;
}

var hasPermission = function(func, permissionsPerUser, userRoles) {
    return hasPermissionInUser(func, permissionsPerUser) ? true : hasPermissionInRole(func, userRoles);
}

var hasPermissionInUser = function(func, permissionsPerUser) {
    for(var i = 0; i < permissionsPerUser.length; i++) {
        if(func == permissionsPerUser[i]) {
            return true;
        }
    }
    return false;
}

var hasPermissionInRole = function(func, userRoles) {
    for(var i = 0; i < userRoles.length; i++) {
        var userRole = userRoles[i];
        for(var j = 0; j < userRole.permissions.length; j++) {
            if(func == userRole.permissions[j]) {
                return true;
            }
        }
    }
    return false;
}

var uniqObjects = function( arr ){
    return us.uniq( us.collect( arr, function( x ){
        return x;
    }));
};

exports.getPermissionsPerUserAndPage = function(req, res) {
    var userId = req.params.id;
    var pageId = req.params.pageId;
    var permissionsList = []; 
    var permissionsPerUser = []; 
    var idsRolesPerUser = []; 
    var userRoles = []; 
    var actionsResult = []; 

    async.series([
        function(callback) {
            dataAccess.PermissionsModel.find({}, function(err, permissions) {
                if(err || permissions == null || permissions.length == 0) {
                    return callback(((permissions == null || permissions.length == 0) ? withoutPermissions : err.message));
                    //res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : err.message)));
                }
                permissionsList = permissionsPerPage(permissions, pageId);
                callback();
            });
        },
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, userPermInfo) { 
                if(err) {
                    return callback(err);
                } else if(userPermInfo == null) {
                    callback();
                } else {
                    permissionsPerUser = userPermInfo.permissions;
                    callback();
                }
            });
        },
        function(callback) {
            dataAccess.UsersRolesModel.findOne({id : userId}, function(err, rolesResult) {
                if (err) return callback(err);

                idsRolesPerUser = (rolesResult == null) ?  [] : rolesResult.roles;
                callback();
            });
        },
        function(callback) {
            dataAccess.RolesModel.find({}).where('id').in(idsRolesPerUser).exec(function(err, roles) {
                if (err) return callback(err);

                userRoles = roles;
                callback();
            });
        },
        function(callback) {
            permissionsList.forEach(function(permission) {
                if(hasPermission(permission.func, permissionsPerUser, userRoles)) {
                    actionsResult.push(permission.text);
                }
            });
            callback();
        }
    ], function(err) {
        res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", uniqObjects(actionsResult), "")));
    });
};


exports.getFullPermissionsPerUser = function(req, res) {
    var userId = req.params.id;
    var permissionsList = []; 
    var permissionsPerUser = []; 
    var idsRolesPerUser = []; 
    var userRoles = []; 
    var funcsResult = []; 

    async.series([
        function(callback) {
            dataAccess.PermissionsModel.find({}, function(err, permissions) {
                if(err || permissions == null || permissions.length == 0) {
                    return callback(((permissions == null || permissions.length == 0) ? withoutPermissions : err.message));
                    //res.json(utils.defineResult("", "ERROR", "", ((permissions == null || permissions.length == 0) ? withoutPermissions : err.message)));
                }
                permissionsList = permissions;
                callback();
            });
        },
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, userPermInfo) { 
                if(err) {
                    return callback(err);
                } else if(userPermInfo == null) {
                    callback();
                } else {
                    permissionsPerUser = userPermInfo.permissions;
                    callback();
                }
            });
        },
        function(callback) {
            dataAccess.UsersRolesModel.findOne({id : userId}, function(err, rolesResult) {
                if (err) return callback(err);

                idsRolesPerUser = rolesResult.roles;
                callback();
            });
        },
        function(callback) {
            dataAccess.RolesModel.find({}).where('id').in(idsRolesPerUser).exec(function(err, roles) {
                if (err) return callback(err);

                userRoles = roles;
                callback();
            });
        },
        function(callback) {
            funcsResult = getFuncs(userRoles, permissionsPerUser, permissionsList);
            callback();
        }
    ], function(err) {
        res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", uniqObjects(funcsResult), "")));
    });
};

var getFuncs = function(userRoles, permissionsPerUser, permissionsList) {
    var permissionsFunc = getPermissionsFunc(permissionsPerUser, permissionsList);
    var rolesFunc = getRolesFunc(userRoles, permissionsList);
    return permissionsFunc.concat(rolesFunc);
};

var getPermissionsFunc = function(permissionsPerUser, permissionsList) {
    var funcs = [];
    for(var i = 0; i < permissionsPerUser.length; i++) {
        for(var j = 0; j < permissionsList.length; j++) {
            var permission = permissionsList[j];
            var exist = false;
            for(var k = 0; k < permission.actions.length; k++) {
                var action = permission.actions[k];
                exist = existBasicAction(permissionsPerUser[i], action.actions);
                if(exist) {
                    funcs.push(action.func);
                    break;
                }
            }
            if(exist) break;
        }
    }
    return funcs;
}

var existBasicAction = function(basicAction, actions) {
    console.log("ACTIONS" + JSON.stringify(actions));
    if ( typeof actions !== 'undefined' && actions ){
    for(var i = 0; i < actions.length; i++) {  //for(var i = 0; i < JSON.parse(actions).length; i++) {
        if(basicAction == actions[i].func) {   //if(basicAction == JSON.parse(actions[i].func)) {
            return true;
        }
    }
    }
    return false;
};

var getRolesFunc = function(userRoles, permissionsList) {
    var funcs = [];
    for(var i = 0; i < userRoles.length; i++) {
        var userRole = userRoles[i];
        for(var x = 0; x < userRole.permissions.length; x++) {
            for(var j = 0; j < permissionsList.length; j++) {
                var permission = permissionsList[j];
                var exist = false;
                for(var k = 0; k < permission.actions.length; k++) {
                    var action = permission.actions[k];
                    exist = existBasicAction(userRole.permissions[x], action.actions);
                    if(exist) {
                        funcs.push(action.func);
                        break;
                    }
                }
                if(exist) break;
            }

        }
    }
    return funcs;
};