require('./base.js');

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hostname = require('os').hostname();

app.set('x-powered-by', false)
app.use( (request, response, next) => {
	response.header('ahh', hostname);
	if (request.headers.origin !== undefined && request.headers.origin.indexOf('algohub.me') >= 0) {
		response.header('Access-Control-Allow-Origin', request.headers.origin);
		response.header('Access-Control-Allow-Credentials', 'true');
	}
	next();
});

// Template settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser());
// Static content settings
// app.use(express.static(path.join(__dirname, 'static')));

// Body parsers for POST requests
// var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: true});

// Controllers
var siteconfig = loadConfig('site').config;
app.get(siteconfig.mgmtpath + 'add', load('controller.AddController'));
app.get(siteconfig.mgmtpath + ':name/:step', load('controller.ModifySectionGet'));
app.post(siteconfig.mgmtpath + ':name/:step', urlencodedParser, load('controller.ModifySectionPost'));
app.post(siteconfig.mgmtpath + 'save', urlencodedParser, load('controller.SaveController'));

app.post(siteconfig.userpath + 'login', urlencodedParser, load('controller.UserLogin'));
app.get(siteconfig.userpath + 'checkLogin', load('controller.UserCheckLogin'));

app.post(siteconfig.commentpath + 'add', urlencodedParser, load('controller.CommentAdd'));

app.post(siteconfig.surveypath + 'save', urlencodedParser, load('controller.SurveySave'));

// Handle 404
app.get('*', load('controller.404'));
app.post('*', load('controller.404'));

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
