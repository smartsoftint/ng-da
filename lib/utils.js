var encryptPassword = function(user, pass) {   
	var crypto = require('crypto');
   	return crypto.createHmac('sha1', user).update(pass).digest('hex');
}

var defineResult = function(statusCode, status, body, exception) {
	var result = {};
	result.statusCode = statusCode;
	result.status = status;
	result.body = body;
	result.exception = exception;
	return result;
}

exports.encryptPassword = encryptPassword;
exports.defineResult = defineResult;