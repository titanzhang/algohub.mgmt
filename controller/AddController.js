const Utils = load('common.Utils');
const BizShared = load('common.BizShared');

module.exports = function(request, response) {
	(async () => {
		try {
			const controller = new AddController();
			const result = await controller.run();
			response.render(result.template, result.result);
		} catch(error) {
			Utils.log(request.originalUrl, error.message || error);
			Utils.log(request.originalUrl, error.stack || 'No stack');
			response.render('page/error', load('common.BizShared').buildErrorModel());
		}
	})();
};

class AddController {
	async run() {
		const siteConfig = loadConfig('site').config;
		const apiConfig = loadConfig('api');
		const pageTitle = siteConfig.title + ' - New';
		const steps = BizShared.buildSteps();
		const allTags = BizShared.getAlgoTags();

		return {
			template: 'page/name',
			result: {
				site: siteConfig,
				api: apiConfig,
				customTitle: pageTitle,
				steps: steps,
				isNew: true,
				tagList: [],
				allTags: allTags
			}
		};
	}

}
