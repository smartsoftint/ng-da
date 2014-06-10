var dataAccess = require('../schemas/schemas');
var async = require('async');
var utils = require('../utils');

var noUsers = 'Without users';
var notFound = 'User not found';
var illegalUserUpdate = 'Update not allowed - User does not match';

var resultado = {
	result : "",
	exception : []
}

var userObj = {
	id: "",
	identification: "",
	name: "",
	email: "",
	address: "",
	roles: [],
	permissions: []
}

var addIdsToUser = function(usersArg) {
	var newUsersArg = [];
	var userNumber = 1;
	usersArg.forEach(function(userArg) {
		if("id" in userArg && userArg.id != "") newUsersArg.push(userArg);
		else {
			userArg.id = "U-" + userNumber + new Date().getTime();
		}
		userNumber++;
		newUsersArg.push(userArg);
	});
	return newUsersArg;
}

var newUser = function(userArg) {
	return new dataAccess.UsersModel({
		"id": userArg.id,
		"identification": userArg.identification,
		"name": userArg.name,
		"lastName": userArg.lastName,
		"surName": userArg.surName,
		"email": userArg.email,
		"address": userArg.address,
		"user": userArg.user,
		"password": utils.encryptPassword(userArg.user, userArg.password),
		"lstLogin" : "6/2/2014"
	});
}

/*
var newUser = function(userArg) {
	return new dataAccess.UsersModel({
		"id": userArg.id,
		"identification": userArg.identification,
		"name": userArg.name,
		"email": userArg.email,
		"address": userArg.address,
		"user": userArg.user,
		"password": utils.encryptPassword(userArg.user, userArg.password),
	});
}*/

var newUserRoles = function(userArg) {
	return new dataAccess.UsersRolesModel({
		"id": userArg.id,
		"roles": userArg.roles
	});
}

var newUserPermissions = function(userArg) {
	return new dataAccess.UsersPermissionsModel({
		"id": userArg.id,
		"permissions": userArg.permissions
	});
}

var rawUser = function(userDB) {
	var userObjL = {};
	userObjL.id = userDB.id;
	userObjL.identification = userDB.identification;
	userObjL.name = userDB.name;
	userObjL.lastName = userDB.lastName;
	userObjL.surName = userDB.surName;
	userObjL.email = userDB.email;
	userObjL.address = userDB.address;
	userObjL.roles = [];
	userObjL.permissions = [];
	userObjL.lstLogin = "6/2/2014";
	return userObjL;
}

/*
var rawUser = function(userDB) {
	var userObjL = {};
	userObjL.id = userDB.id;
	userObjL.identification = userDB.identification;
	userObjL.name = userDB.name;
	userObjL.email = userDB.email;
	userObjL.address = userDB.address;
	userObjL.roles = [];
	userObjL.permissions = [];
	return userObjL;
}*/

var fullUser = function(userDB) {
	var fullUserObj = rawUser(userDB);
	fullUserObj.user = userDB.user;
	fullUserObj.password = userDB.password;
	return fullUserObj;
}

exports.getUsers = function(req, res) {
	var usersObj = [];
	var usersIds = [];
	var permissionsList = [];

	async.series([
        function(callback) {
            dataAccess.UsersModel.find({}, function(err, users) {
                if (err) return callback(err);

                if (users.length == 0) {
                    return callback(new Error(noUsers));
                }

                for(var i = 0; i < users.length; i++) {
					var userDB = users[i];
					usersIds.push(userDB.id);
					usersObj.push(rawUser(userDB));
				}
                callback();
            });
        },
        function(callback) {
            dataAccess.UsersRolesModel.find({}).where('id').in(usersIds).exec(function(err, roles) {
                if (err) return callback(err);
                
                for(var i = 0; i < roles.length; i++) {
					for(var j = 0; j < usersObj.length; j++) {
						if(roles[i].id == usersObj[j].id) {
							usersObj[j].roles = roles[i].roles;
							break;
						}
					}	
				}
                callback();
            });
        },
        function(callback) {
            dataAccess.UsersPermissionsModel.find({}).where('id').in(usersIds).exec(function(err, permissions) {
                if (err) return callback(err);
                
                for(var i = 0; i < permissions.length; i++) {
					for(var j = 0; j < usersObj.length; j++) {
						if(permissions[i].id == usersObj[j].id) {
							usersObj[j].permissions = permissions[i].permissions;
							break;
						}
					}	
				}
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
        	for(var i = 0;  i < usersObj.length; i++) {
        		for(var j = 0; j < usersObj[i].permissions.length; j++) {
        			var perm = usersObj[i].permissions[j];
        			for(var k = 0;  k < fullPermissions.length; k++) {
        				if(perm.func == fullPermissions[k].func) {
	        				usersObj[i].permissions[j].url = fullPermissions[k].url;
	        				usersObj[i].permissions[j].text = fullPermissions[k].text;
	        				break;
	        			}
        			}
        		}
        	}
        	callback();
        }
    ], function(err) {
        if (err) {
        	res.json(((err.message == noUsers) ? utils.defineResult("200", "OK", [], "") : utils.defineResult("", "ERROR", "", err)));
        } else {
        	res.json(utils.defineResult("200", "OK", usersObj, ""));
        }
    });
};

exports.postUsers = function(req, res) {
	var usersArg = [JSON.parse(JSON.stringify(req.body))];
	console.log("aaa:s" + usersArg+"s");
	console.log("aaa:s" + JSON.stringify(req.body)+"s");
	var hasErrors = false;
	var usersErrors = [];
	var hasRolesErrors = false;
	var usersRolesErrors = [];
	var hasPermissionsErrors = false;
	var usersPermissionsErrors = [];

	async.series([
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(user, callbackfe) {
						var userToAdd = newUser(user);	
						var userToAddObj = userToAdd.toObject();
						delete userToAddObj._id;

						dataAccess.UsersModel.update({id: user.id}, userToAddObj, {upsert: true}, function(err, userToAdd) {
							if (err) {
					  			hasErrors = true;
					  			usersErrors.push(err);
					  		}
							callbackfe();
						});
					},
					function(err) {
						return;
					}
				);
			}
			callback();
		}, 
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(user, callbackfe) {
						if("roles" in user) {
							var userRolesToAdd = newUserRoles(user);	
							var userRolesToAddObj = userRolesToAdd.toObject();
							delete userRolesToAddObj._id;

							dataAccess.UsersRolesModel.update({id: user.id}, userRolesToAddObj, {upsert: true}, function(err, userRolesToAdd) {
								if (err) {
						  			hasRolesErrors = true;
						  			usersRolesErrors.push(err);
						  		}
								callbackfe();
							});
						} else {
							callbackfe();
						}
					},
					function(err) {
						return;
					}
				);
			}
			callback();
		}, 
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(user, callbackfe) {
						if("permissions" in user) {
							var userPermissionsToAdd = newUserPermissions(user);	
							var userPermissionsToAddObj = userPermissionsToAdd.toObject();
							delete userPermissionsToAddObj._id;

							dataAccess.UsersPermissionsModel.update({id: user.id}, userPermissionsToAddObj, {upsert: true}, function(err, userPermissionsToAdd) {
								if (err) {
						  			hasPermissionsErrors = true;
						  			usersPermissionsErrors.push(err);
						  		}
								callbackfe();
							});
						} else {
							callbackfe();
						}
					},
					function(err) {
						return;
					}
				);
			}
			callback();
		}, 
	], function(err) {
		if(hasErrors || hasPermissionsErrors || hasRolesErrors) {
			var errorsReport = {};
			errorsReport.exceptionUsers = usersErrors;
			errorsReport.exceptionRoles = usersRolesErrors;
			errorsReport.exceptionPermissions = usersPermissionsErrors;
			res.json(utils.defineResult("", "ERROR", "", errorsReport));
		} else {
			res.json(utils.defineResult("200", "OK", "", ""));
		}
    });
};

exports.putUsers = function(req, res) {
	console.log("Put users " + JSON.stringify(req.body));
	var usersArg = [JSON.parse(JSON.stringify(req.body))];
	var hasErrors = false;
	var usersErrors = [];
	var hasRolesErrors = false;
	var usersRolesErrors = [];
	var hasPermissionsErrors = false;
	var usersPermissionsErrors = [];
	var usersArgWithIds = addIdsToUser(usersArg);
	var idUser = "";

	async.series([
		function(callback) {
			if(usersArgWithIds.length > 0) {
				async.each(usersArgWithIds,
					function(user, callbackfe) {
						var userToAdd = newUser(user);
						idUser = userToAdd.id;
						console.log("userss "+ idUser);
						userToAdd.save(function(err, roleToAdd) {
					  		if (err) {
					  			hasErrors = true;
					  			usersErrors.push(err);
					  		}
					  		callbackfe();
						});
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
		function(callback) {
			if(usersArgWithIds.length > 0) {
				async.each(usersArgWithIds,
					function(user, callbackfe) {
						if("roles" in user) {
							var userRolesToAdd = newUserRoles(user);
							userRolesToAdd.save(function(err, userRolesToAdd) {
						  		if (err) {
						  			hasRolesErrors = true;
						  			usersRolesErrors.push(err);
						  		}
						  		callbackfe();
							});
						} else {
							callbackfe();
						}
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
		function(callback) {
			if(usersArgWithIds.length > 0) {
				async.each(usersArgWithIds,
					function(user, callbackfe) {
						if("permissions" in user) {
							var userPermissionsToAdd = newUserPermissions(user);
							userPermissionsToAdd.save(function(err, userPermissionsToAdd) {
						  		if (err) {
						  			hasPermissionsErrors = true;
						  			usersPermissionsErrors.push(err);
						  		}
						  		callbackfe();
							});
						} else {
							callbackfe();
						}
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
	], function(err) {
		if(hasErrors || hasPermissionsErrors || hasRolesErrors) {
			var errorsReport = {};
			errorsReport.exceptionUsers = usersErrors;
			errorsReport.exceptionRoles = usersRolesErrors;
			errorsReport.exceptionPermissions = usersPermissionsErrors;
			res.json(utils.defineResult("", "ERROR", "", errorsReport));
		} else {
			res.json(utils.defineResult("200", "OK", idUser, ""));
		}
    });
};

exports.deleteUsers = function(req, res) {
	console.log("delete Users " + JSON.parse(JSON.stringify(req.body)));
	var usersArg = [JSON.parse(JSON.stringify(req.body))];
	var hasErrors = false;
	var usersErrors = [];
	var hasRolesErrors = false;
	var usersRolesErrors = [];
	var hasPermissionsErrors = false;
	var usersPermissionsErrors = [];

	async.series([
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(userToDel, callbackfe) {
						dataAccess.UsersModel.remove({id: userToDel }, function(err, userToDel) {
					  		if (err) {
					  			hasErrors = true;
					  			usersErrors.push(err);
					  		}
					  		callbackfe();
						});
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(userToDel, callbackfe) {
						dataAccess.UsersRolesModel.remove({id: userToDel }, function(err, userToDel) {
					  		if (err) {
					  			hasRolesErrors = true;
					  			usersRolesErrors.push(err);
					  		}
					  		callbackfe();
						});
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
		function(callback) {
			if(usersArg.length > 0) {
				async.each(usersArg,
					function(userToDel, callbackfe) {
						dataAccess.UsersPermissionsModel.remove({id: userToDel }, function(err, userToDel) {
					  		if (err) {
					  			hasPermissionsErrors = true;
					  			usersPermissionsErrors.push(err);
					  		}
					  		callbackfe();
						});
					},
					function(err) {
						callback();
					}
				);
			}
		}, 
	], function(err) {
		if(hasErrors || hasPermissionsErrors || hasRolesErrors) {
			var errorsReport = {};
			errorsReport.exceptionUsers = usersErrors;
			errorsReport.exceptionRoles = usersRolesErrors;
			errorsReport.exceptionPermissions = usersPermissionsErrors;
			res.json(utils.defineResult("", "ERROR", "", errorsReport));
		} else {
			res.json(utils.defineResult("200", "OK", "", ""));
		}
    });
};

exports.getUser = function(req, res) {
	var userId = req.params.id;
	var userDB;

	async.series([
        function(callback) {
            dataAccess.UsersModel.findOne({id : userId}, function(err, user) {
                if (err) return callback(err);

                if (user == null) {
                    return callback(new Error(notFound));
                }
                userDB = fullUser(user);
                delete userDB.password;
                callback();
            });
        },
        function(callback) {
            dataAccess.UsersRolesModel.findOne({id : userId}, function(err, rolesResult) {
                if (err) return callback(err);

                userDB.roles = rolesResult.roles;
                console.log("ROLES de user" + rolesResult.roles);
                callback();
            });
        }
        /*,
        function(callback) {
            dataAccess.UsersPermissionsModel.findOne({id : userId}, function(err, permissionsResult) {
                if (err) return callback(err);

                userDB.permissions = permissionsResult.permissions;
                callback();
            });
        }*/
    ], function(err) {
        if (err) {
			res.json(utils.defineResult("", "ERROR", "", ((err.message == notFound) ? notFound : err)));
        } else {
        	//delete userDB.roles;
        	//delete userDB.permissions;
        	console.log("userDB "+ JSON.stringify(userDB));
        	res.json(utils.defineResult("200", "OK", userDB, ""));
        }
    });
};

exports.postUser = function(req, res) {
	var userId = req.params.id;
	var userArg = JSON.parse(JSON.stringify(req.body));

	async.series([
		function(callback) {
			if(userId == userArg.id) {
				var userToAdd = newUser(userArg);	
				var userToAddObj = userToAdd.toObject();
				delete userToAddObj._id;

				dataAccess.UsersModel.update({id: userArg.id}, userToAddObj, {upsert: true}, function(err, userToAdd) {
					if (err) return callback(err);

					callback();
				});
			} else return callback(illegalUserUpdate);
		}, 
		function(callback) {
			if("roles" in userArg) {
				var userRolesToAdd = newUserRoles(userArg);	
				var userRolesToAddObj = userRolesToAdd.toObject();
				delete userRolesToAddObj._id;

				dataAccess.UsersRolesModel.update({id: userArg.id}, userRolesToAddObj, {upsert: true}, function(err, userRolesToAdd) {
					if (err) return callback(err);

					callback();
				});
			} else callback();
		}, 
		function(callback) {
			if("permissions" in userArg) {
				var userPermissionsToAdd = newUserPermissions(userArg);	
				var userPermissionsToAddObj = userPermissionsToAdd.toObject();
				delete userPermissionsToAddObj._id;

				dataAccess.UsersPermissionsModel.update({id: userArg.id}, userPermissionsToAddObj, {upsert: true}, function(err, userPermissionsToAdd) {
					if (err) return callback(err);

					callback();
				});
			} else callback();
		}, 
	], function(err) {
		res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.deleteUser = function(req, res) {
	var userToDel = req.params.id;

	async.series([
		function(callback) {
			dataAccess.UsersModel.remove({id: userToDel }, function(err, userToDel) {
		  		if (err) return callback(err);

		  		callback();
			});
		}, 
		function(callback) {
			dataAccess.UsersRolesModel.remove({id: userToDel }, function(err, userToDel) {
		  		if (err) return callback(err);

		  		callback();
			});
		}, 
		function(callback) {
			dataAccess.UsersPermissionsModel.remove({id: userToDel }, function(err, userToDel) {
		  		if (err) return callback(err);

		  		callback();
			});
		}, 
	], function(err) {
		res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
    });
};

exports.getUsersBy = function(req, res) {
	var querySearch = {};
	if("id" in req.query) uerySearch.id = req.query.id;
	if("identification" in req.query) querySearch.identification = req.query.identification;
	if("name" in req.query) querySearch.name = req.query.name;
	if("lastName" in req.query) querySearch.lastName = req.query.lastName;
	if("surName" in req.query) querySearch.surName = req.query.surName;
	if("email" in req.query) querySearch.email = req.query.email;
	if("address" in req.query) querySearch.address = req.query.address;
	if("user" in req.query) querySearch.user = req.query.user;

	if(querySearch != {}) {
		dataAccess.UsersModel.find(querySearch, function(err, users) {
            if (err) {
				res.json(utils.defineResult("", "ERROR", "", err));
            } else if (users.length == 0) {
        		res.json(utils.defineResult("200", "OK", [], ""));
            } else {
            	var userList = [];
            	users.forEach(function(user) {
            		var userElement = rawUser(user);
            		delete userElement.roles;
            		delete userElement.permissions;
            		userElement.user = user.user;
            		userList.push(userElement);
            	});
        		res.json(utils.defineResult("200", "OK", userList, ""));
            }
        });
	} else {
		res.json(utils.defineResult("200", "OK", [], ""));
	}
};

exports.deleteUsersBy = function(req, res) {
	var querySearch = {};
	if("id" in req.query) uerySearch.id = req.query.id;
	if("identification" in req.query) querySearch.identification = req.query.identification;
	if("name" in req.query) querySearch.name = req.query.name;
	if("lastName" in req.query) querySearch.lastName = req.query.lastName;
	if("surName" in req.query) querySearch.surName = req.query.surName;
	if("email" in req.query) querySearch.email = req.query.email;
	if("address" in req.query) querySearch.address = req.query.address;
	if("user" in req.query) querySearch.user = req.query.user;

	if(querySearch != {}) {
		dataAccess.UsersModel.remove(querySearch, function(err) {
			res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
        });
	} else {
		res.json(utils.defineResult("200", "OK", "", ""));
	}
};