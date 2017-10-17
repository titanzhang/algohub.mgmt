module.exports = function(request, response) {
	(async () => {
		try {
			const controller = new AddController();
			const result = await controller.run();
			response.render(result.template, result.result);
		} catch(error) {
			load('common.Utils').log(request.originalUrl, error.message);
			response.render('page/error', {
				site: loadConfig('site').config,
				customTitle: 'Page Error',
				errorTitle: 'This page is temporary unavailable',
				errorMessage: 'The page you visited may be broken, or under maintanence.'
			});
		}
	})();
};

class AddController {

	async run() {
		const siteConfig = loadConfig('site').config;
		const pageTitle = siteConfig.title + ' - New';
		const steps = load('common.BizShared').buildSteps();
		const allTags = load('common.BizShared').getAlgoTags();

		return {
			template: 'page/name',
			result: {
				site: siteConfig,
				customTitle: pageTitle,
				steps: steps,
				isNew: true,
				tagList: [],
				allTags: allTags
			}
		};
	}

}