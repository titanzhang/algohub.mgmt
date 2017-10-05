module.exports = function(request, response) {
	const controller = new AddController();
	controller.run()
		.then( (result) => {
			response.render(result.template, result.result);
		})
		.catch( (error) => {
			response.render('page/error', {
				site: loadConfig('site').config,
				customTitle: 'Page Error',
				errorTitle: 'This page is temporary unavailable',
				errorMessage: 'The page you visited may be broken, or under maintanence.'
			});
		});
};

var AddController = function() {
};

AddController.prototype.run = function() {
	const siteConfig = loadConfig('site').config;
	const pageTitle = siteConfig.title + ' - New';
	const steps = load('common.BizShared').buildSteps();

	return Promise.resolve({
		template: 'page/name',
		result: {
			site: siteConfig,
			customTitle: pageTitle,
			steps: steps,
			isNew: true
		}
	});
}