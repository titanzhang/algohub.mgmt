require('./base.js');

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
const hostname = require('os').hostname();

app.set('x-powered-by', false)

// Template settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use( (request, response, next) => {
	response.header('ahh', hostname);
	next();
});

// Static content settings
// app.use(express.static(path.join(__dirname, 'static')));

// Body parsers for POST requests
// var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: true});

// Controllers
app.get('/mgmt/add', load('controller.AddController'));
app.get('/mgmt/:name/:step', load('controller.ModifySectionGet'));
app.post('/mgmt/:name/:step', urlencodedParser, load('controller.ModifySectionPost'));
app.post('/mgmt/save', urlencodedParser, load('controller.SaveController'));


// Handle 404
app.get('*', function(req, res) {
	res.status(404);
	if (req.accepts('html')) {
		res.render('404', {url: req.url});
		return;
	}

	if (req.accepts('json')) {
		res.send({error: 'Not found'});
		return;
	}

	res.send('Not found');
});

var ahServer = app.listen(loadConfig('server').port, function() {
	console.log('Server is listening on port ' + loadConfig('server').port);
});

// Gracefully shutdown server
var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down gracefully.");
  ahServer.close( () => {
    console.log("Closed out remaining connections.");
    process.exit()
  });
  
	setTimeout( () => {
		console.error("Could not close connections in time, forcefully shutting down");
		process.exit()
	}, 10*1000);
}

// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);
