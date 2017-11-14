module.exports = function(request, response) {
	response.status(404);
	if (request.accepts('html')) {
		response.render(
			'page/error',
			load('common.BizShared').buildErrorModel(
				'Page Not Found',
				'This page isn\'t available',
				'The page you visited may be broken, or removed.')
		);
		return;
	}

	if (request.accepts('json')) {
		response.send({status: false, message: 'Page Not Found'});
		return;
	}

	response.send('Page Not Found');
};