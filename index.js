var express = require('express');
var app = express();
var dataAccess = require('./lib/schemas/schemas');
var bodyParser = require('body-parser');
var rolesController = require('./lib/controllers/roles');
var usersController = require('./lib/controllers/users');
var permissionsController = require('./lib/controllers/permissions');
var sessionsController = require('./lib/controllers/sessions');

app.use(bodyParser());

app.get('/', function(req, res) {
	var welcome = 'Data Access Sentinel NG - Prototipo<br/><br/>Expongo:<br/>';
	welcome += 'GET /Sentinel/v1.0/Permissions<br/>';
	welcome += 'GET /Sentinel/v1.0/Roles<br/>';
	welcome += 'POST /Sentinel/v1.0/Roles<br/>';
	welcome += 'PUT /Sentinel/v1.0/Roles<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Roles<br/>';
	welcome += 'GET /Sentinel/v1.0/Roles/:id<br/>';
	welcome += 'POST /Sentinel/v1.0/Roles/:id<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Roles/:id<br/>';
	welcome += 'GET /Sentinel/v1.0/Users<br/>';
	welcome += 'POST /Sentinel/v1.0/Users<br/>';
	welcome += 'PUT /Sentinel/v1.0/Users<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Users<br/>';
	welcome += 'GET /Sentinel/v1.0/Users/:id<br/>';
	welcome += 'POST /Sentinel/v1.0/Users/:id<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Users/:id<br/>';
	welcome += 'GET /Sentinel/v1.0/Roles/:id/permissions<br/>';
	welcome += 'POST /Sentinel/v1.0/Roles/:id/permissions<br/>';
	welcome += 'PUT /Sentinel/v1.0/Roles/:id/permissions<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Roles/:id/permissions<br/>';
	welcome += 'GET /Sentinel/v1.0/Users/:id/permissions<br/>';
	welcome += 'POST /Sentinel/v1.0/Users/:id/permissions<br/>';
	welcome += 'PUT /Sentinel/v1.0/Users/:id/permissions<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Users/:id/permissions<br/>';
	welcome += 'POST /Sentinel/v1.0/login<br/>';
	welcome += 'DELETE /Sentinel/v1.0/logout<br/>';
	welcome += 'GET /Sentinel/v1.0/Users/:id/sessions<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Users/:id/sessions<br/>';
	welcome += 'GET /Sentinel/v1.0/Sessions/actives<br/>';
	welcome += 'GET /Sentinel/v1.0/Sessions/inactives<br/>';
	welcome += 'GET /Sentinel/v1.0/Users/query/by<br/>';
	welcome += 'DELETE /Sentinel/v1.0/Users/query/by';
	res.send(welcome);
});

app.get('/Sentinel/v1.0/Roles', rolesController.get);
app.post('/Sentinel/v1.0/Roles', rolesController.post);
app.put('/Sentinel/v1.0/Roles', rolesController.put);
app.delete('/Sentinel/v1.0/Roles', rolesController.delete);

app.get('/Sentinel/v1.0/Roles/:id', rolesController.getRole);
app.post('/Sentinel/v1.0/Roles/:id', rolesController.postRole);
app.delete('/Sentinel/v1.0/Roles/:id', rolesController.deleteRole);

app.get('/Sentinel/v1.0/Users', usersController.getUsers);
app.post('/Sentinel/v1.0/Users', usersController.postUsers);
app.put('/Sentinel/v1.0/Users', usersController.putUsers);
app.delete('/Sentinel/v1.0/Users', usersController.deleteUsers);

app.get('/Sentinel/v1.0/Users/:id', usersController.getUser);
app.post('/Sentinel/v1.0/Users/:id', usersController.postUser);
app.delete('/Sentinel/v1.0/Users/:id', usersController.deleteUser);

app.get('/Sentinel/v1.0/Roles/:id/permissions', permissionsController.getPermissionsPerRole);
app.post('/Sentinel/v1.0/Roles/:id/permissions', permissionsController.postPermissionsPerRole);
app.put('/Sentinel/v1.0/Roles/:id/permissions', permissionsController.putPermissionsPerRole);
app.delete('/Sentinel/v1.0/Roles/:id/permissions', permissionsController.deletePermissionsPerRole);

app.get('/Sentinel/v1.0/Users/:id/permissions', permissionsController.getPermissionsPerUser);
app.post('/Sentinel/v1.0/Users/:id/permissions', permissionsController.postPermissionsPerUser);
app.put('/Sentinel/v1.0/Users/:id/permissions', permissionsController.putPermissionsPerUser);
app.delete('/Sentinel/v1.0/Users/:id/permissions', permissionsController.deletePermissionsPerUser);

app.post('/Sentinel/v1.0/login', sessionsController.login);
app.delete('/Sentinel/v1.0/logout', sessionsController.logout);

app.get('/Sentinel/v1.0/Users/:id/sessions', sessionsController.getSessions);
app.delete('/Sentinel/v1.0/Users/:id/sessions', sessionsController.deleteSessions);

app.get('/Sentinel/v1.0/Sessions/actives', sessionsController.getActiveSessions);
app.get('/Sentinel/v1.0/Sessions/inactives', sessionsController.getInactiveSessions);

app.get('/Sentinel/v1.0/Users/query/by', usersController.getUsersBy);
app.delete('/Sentinel/v1.0/Users/query/by', usersController.deleteUsersBy);

app.get('/Sentinel/v1.0/Permissions', permissionsController.getAllPermissions);



app.listen(3636, function() {
    console.log("Nodo ejecutandose en el puerto 3636")
});
