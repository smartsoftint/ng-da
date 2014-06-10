var dataAccess = require('../schemas/schemas');
var async = require('async');
var utils = require('../utils');

var notFound = 'User not found';
var sessionsNotFound = 'Sessions not found';
var sessionActive = "Active";
var sessionInactive = "Inactive";

var resultado = {
	result : "",
	exception : []
}

var addPermissions = function(permissionsRoles, permissionsUser) {
	var permissionsMap = {};

	permissionsRoles.forEach(function(permission) {
		if (!(permission.func in permissionsMap)) {
			permissionsMap[permission.func] = permission;
		}
	});

	permissionsUser.forEach(function(permission) {
		if (!(permission.func in permissionsMap)) {
			permissionsMap[permission.func] = permission;
		}
	});

	return permissionsMap;
}

var permissionsPerRole = function(roles, userRoles) {
	var permissionsList = [];
	userRoles.forEach(function(roleId) {
		for(var i = 0; i < roles.length; i++) {
			if(roleId == roles[i].id) {
				roles[i].permissions.forEach(function(permission) {
					permissionsList.push(permission);
				});
				break;
			}
		}
	});
	return permissionsList;
}

var newSession = function(sessionObj) {
	return new dataAccess.SessionsModel({
		"id": sessionObj.id,
		"expires": sessionObj.expires,
		"expirationDate": sessionObj.expirationDate,
		"status": sessionObj.status,
		"user": sessionObj.user
	});
}

var newObjSession = function(currentTime, expires, id) {
	var date = new Date(currentTime);
	var expirationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
	var sessionObj = {};
	sessionObj.id = "S-" + currentTime;
	sessionObj.expires = expires;
	sessionObj.expirationDate = expirationDate;
	sessionObj.status = sessionActive;
	sessionObj.user = id;
	return sessionObj;
}


exports.login = function(req, res) {
    console.log("login " + req);
	var credentials = JSON.parse(JSON.stringify(req.body));
    console.log('credentials' + JSON.stringify(credentials));
	var encryptedPass = utils.encryptPassword(credentials.user, credentials.password);
    console.log('credentials' + JSON.stringify(encryptedPass));
	var userLogged = {};
	var userDB;
	var userPermissionsDB = [];
	var userRoleDB = [];
	var permissionsMap = {};
	var fullPermissions = [];
	var fullRoles = [];
	var permissionsList = [];
	var sessionId = "0";
    var expirationDateSession = "0";

	async.series([
        function(callback) {
            console.log("callback1");
            dataAccess.UsersModel.findOne({user : credentials.user, password : encryptedPass}, function(err, user) {
                if (err) return callback(err);

                if (user == null) return callback("User not found");

            console.log("error");
              //  if (user == null) return callback(new Error(notFound));
                console.log("error2");
                userDB = user;
                console.log("userDB"+ userDB);
                callback();
            });
        },
        function(callback) {
            console.log("callback2");
            dataAccess.UsersRolesModel.findOne({id : userDB.id}, function(err, rolesResult) {
                if (err) return callback(err);

                userRoleDB = rolesResult.roles;
                console.log("userRoleDB"+ userRoleDB);
                callback();
            });
        },
        /*
        function(callback) {
            console.log("callback3");
            dataAccess.UsersPermissionsModel.findOne({id : userDB.id}, function(err, permissionsResult) {
                if (err) return callback(err);

                userPermissionsDB = permissionsResult.permissions;
                console.log("use");
                callback();
            });
        },*/
        function(callback) {
            console.log("callback4");
        	dataAccess.PermissionsModel.find({}, function(err, permissions) {
        		if (err) return callback(err);

        		fullPermissions = permissions;
        		callback();
        	});
        }, 
        function(callback) {
            console.log("callback5");
        	dataAccess.RolesModel.find({}, function(err, roles) {
        		if (err) return callback(err);

        		fullRoles = roles;
        		callback();
        	});
        },
        function(callback) {
        	permissionsMap = addPermissions(permissionsPerRole(fullRoles, userRoleDB), userPermissionsDB);
        	fullPermissions.forEach(function(permission) {
        		if(permission.func in permissionsMap) {
        			var permissionElement = {};
        			permissionElement.func = permission.func;
        			permissionElement.url = permission.url;
                    permissionElement.text = permission.text;
        			permissionElement.actions = permissionsMap[permission.func].actions;
        			permissionsList.push(permissionElement);
        		}
        	});
        	callback();
        }, 
        function(callback) {
        	var currentTime = new Date().getTime();
        	dataAccess.SessionsModel.findOne({status : sessionActive, user : userDB.id, expires : "yes"}, function(err, session) {
        		if (err) return callback(err);

        		if (session == null) {
        			var sessionObj = newObjSession(currentTime, "yes", userDB.id);
        			var sessionToAdd = newSession(sessionObj);
					sessionToAdd.save(function(err, sessionToAdd) {
				  		if (err) return callback(err);

				  		sessionId = sessionToAdd.toObject().id;
                        expirationDateSession = sessionToAdd.toObject().expirationDate;
				  		callback();
					});
        		} else {
        			if(session.expirationDate >= currentTime) {
        				sessionId = session.id;
                        expirationDateSession = session.expirationDate;
				  		callback();
        			} else {
        				session.status = sessionInactive;
        				var sessionToAdd = newSession(session);
        				var sessionToAddObj = sessionToAdd.toObject();
						delete sessionToAddObj._id;
						dataAccess.SessionsModel.update({id: sessionToAdd.id}, sessionToAddObj, {upsert: true}, function(err, sessionToAdd) {
							if (err)  return callback(err);

							var sessionObj = newObjSession(currentTime, "yes", userDB.id);
        					var sessionToAdd2 = newSession(sessionObj);
        					sessionToAdd2.save(function(err, sessionToAdd2) {
						  		if (err) return callback(err);

						  		sessionId = sessionToAdd2.toObject().id;
                                expirationDateSession = sessionToAdd2.toObject().expirationDate;
						  		callback();
							});
						});
        			}
        		}
        	});
        }
    ], function(err) {
        if (err) {
            res.json(utils.defineResult("", "ERROR", "", ((err.message == notFound) ? notFound : err)));
        } else {
        	var userResult = {};
			userResult.session = sessionId;
            userResult.expirationDate = expirationDateSession;
			userResult.id = userDB.id;
			userResult.user = userDB.user;
			userResult.name = userDB.name;
            userResult.lastName = userDB.lastName;
            userResult.surName = userDB.surName;
			userResult.permissions = permissionsList;
            res.json(utils.defineResult("200", "OK", userResult, ""));
        }
    });        	
};

exports.logout = function(req, res) {
	var credentials = JSON.parse(JSON.stringify(req.body));
	var encryptedPass = utils.encryptPassword(credentials.user, credentials.password);

	async.series([
        function(callback) {
            dataAccess.UsersModel.findOne({user : credentials.user, password : encryptedPass}, function(err, user) {
                if (err) return callback(err);

                if (user == null) return callback(new Error(notFound));
                
                userDB = user;
                callback();
            });
        },
        function(callback) {
        	dataAccess.SessionsModel.find({status : sessionActive, user : userDB.id, expires : "yes"}, function(err, sessions) {
        		if (err) return callback(err);

        		if(sessions.length > 0) {
					async.each(sessions,
						function(session, callbackfe) {
							session.status = sessionInactive;
							var sessionToAdd = newSession(session);	
							var sessionToAddObj = sessionToAdd.toObject();
							delete sessionToAddObj._id;

							dataAccess.SessionsModel.update({id: session.id}, sessionToAddObj, {upsert: true}, function(err, sessionToAdd) {
								if (err) return callback(err);

								callbackfe();
							});
						},
						function(err) {
							return;
						}
					);
				}
				callback();
        	});
        }
    ], function(err) {
        if (err) {
            res.json(utils.defineResult("", "ERROR", "", ((err.message == notFound) ? notFound : err)));
        } else {
            res.json(utils.defineResult("200", "OK", "", ""));
        }
    });
};

exports.getSessions = function(req, res) {
    var userId = req.params.id;
    dataAccess.SessionsModel.find({user : userId}, function (err, sessions) {
        if(err) {
            res.json(utils.defineResult("", "ERROR", "", err));
        } else if (sessions == null) {
            res.json(utils.defineResult("200", "OK", [], ""));
        } else {
            res.json(utils.defineResult("200", "OK", sessions, ""));
        }
    });
};

exports.getActiveSessionsPerUser = function(req, res) {
    dataAccess.SessionsModel.find({user : userId, status : sessionActive}, function (err, sessions) {
        if(err) {
            res.json(utils.defineResult("", "ERROR", "", err));
        } else if (sessions == null) {
            res.json(utils.defineResult("200", "OK", [], ""));
        } else {
            res.json(utils.defineResult("200", "OK", sessions, ""));
        }
    });
};

exports.getInactiveSessionsPerUser = function(req, res) {
    dataAccess.SessionsModel.find({user : userId, status : sessionInactive}, function (err, sessions) {
        if(err) {
            res.json(utils.defineResult("", "ERROR", "", err));
        } else if (sessions == null) {
            res.json(utils.defineResult("200", "OK", [], ""));
        } else {
            res.json(utils.defineResult("200", "OK", sessions, ""));
        }
    });
};

exports.getActiveSessions = function(req, res) {
    dataAccess.SessionsModel.find({status : sessionActive}, function (err, sessions) {
        if(err) {
            res.json(utils.defineResult("", "ERROR", "", err));
        } else if (sessions == null) {
            res.json(utils.defineResult("200", "OK", [], ""));
        } else {
            res.json(utils.defineResult("200", "OK", sessions, ""));
        }
    });
};

exports.getInactiveSessions = function(req, res) {
    dataAccess.SessionsModel.find({status : sessionInactive}, function (err, sessions) {
        if(err) {
            res.json(utils.defineResult("", "ERROR", "", err));
        } else if (sessions == null) {
            res.json(utils.defineResult("200", "OK", [], ""));
        } else {
            res.json(utils.defineResult("200", "OK", sessions, ""));
        }
    });
};

exports.deleteSessions = function(req, res) {
    var sessionsIds = JSON.parse(JSON.stringify(req.body));
    var sessionsToModify;

    if(sessionsIds.length > 0) {
        async.series([
            function(callback) {
                dataAccess.SessionsModel.find({}).where('id').in(sessionsIds).exec(function(err, sessions) {
                    if (err)  return callback(err);

                    if(sessions == null || sessions.length == 0) return callback(sessionsNotFound);

                    sessionsToModify = sessions;

                    callback();
                });
            },
            function(callback) {
                async.each(sessionsToModify,
                    function(sessionToModify, callbackfe) {
                        sessionToModify.status = sessionInactive;
                        var sessionToAdd = newSession(sessionToModify);
                        var sessionToAddObj = sessionToAdd.toObject();
                        delete sessionToAddObj._id;

                        dataAccess.SessionsModel.update({id: sessionToModify.id}, sessionToAddObj, {upsert: true}, function(err, sessionToAdd) {
                            if (err) return callback(err);

                            callbackfe();
                        });
                    },
                    function(err) {
                    }
                );
                callback();
            }
        ], function(err) {
            res.json(((err) ? utils.defineResult("", "ERROR", "", err) : utils.defineResult("200", "OK", "", "")));
        });
    } else {
        res.json(utils.defineResult("200", "OK", "", ""));
    }
};