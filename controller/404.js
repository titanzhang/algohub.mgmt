module.exports = function(request, response) {
	response.status(404);
	if (request.accepts('html')) {
		response.render('page/error', {
			site: loadConfig('site').config,
			customTitle: 'Page Not Found',
			errorTitle: 'This page isn\'t available',
			errorMessage: 'The page you visited may be broken, or removed.'
		});
		return;
	}

	if (request.accepts('json')) {
		response.send({status: false, message: 'Page Not Found'});
		return;
	}

	response.send('Page Not Found');
};