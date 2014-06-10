var Cryptr = require("cryptr");

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


var sessionEncripted = function (jsonSession) {
    //console.log("ENCRIPTAR");
    var ip = jsonSession.ip;
    cryptr = new Cryptr('variable');
    var encryptedString = cryptr.encrypt(JSON.stringify(jsonSession));
    return encryptedString;
}


var sessionDesencripted = function (session) {
	cryptr = new Cryptr('variable');
    var encryptedString1 = cryptr.decrypt(session);
    console.log("desencryptedString " + encryptedString1);
    return encryptedString1;
}
   

exports.encryptPassword = encryptPassword;
exports.defineResult = defineResult;
exports.sessionEncripted = sessionEncripted;
exports.sessionDesencripted = sessionDesencripted;