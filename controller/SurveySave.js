const Utils = load('common.Utils');
const Survey = load('common.SurveyGithub');
const BizShared = load('common.BizShared');

module.exports = (request, response) => {
	const renderPage = (result) => {
    response.redirect(result.url);
	};

	const renderError = (error) => {
		Utils.log(request.originalUrl, error.message || error);
    response.render('page/error', BizShared.buildErrorModel());
	};

	(async () => {
		try {
			const controller = new SurveySaveController(request);
			const result = await controller.run();
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
};

class SurveySaveController {
	constructor(request) {
		this.request = request;
	}

	parseParameters() {
		try {
			const reqBody = this.request.body;

			if (!reqBody.title || !reqBody.returl) {
				throw new Error('Invalid request body');
			}

      const data = {};
      for (let key in reqBody) {
        if (key === 'title' || key === 'returl') continue;
        data[key] = reqBody[key];
      }

			return {title: reqBody.title, returl: reqBody.returl, data: data};
		} catch(e) {
			Utils.log('SurveySaveController.parseParameters', e.message || e);
			Utils.log('SurveySaveController.parseParameters', e.stack || 'No stack');
			throw e;
		}
	}

	async save({title, data}) {
		try {
			const survey = new Survey();
			await survey.save({
				title: title,
				data: data
			});
		} catch(e) {
			Utils.log('SurveySaveController.save', e.message || e);
			Utils.log('SurveySaveController.save', e.stack || 'No stack');
			throw e;
		}
	}

	buildModel({url}) {
		return {
			url: url
		};
	}

	async run() {
		try {
			const {title, returl, data} = this.parseParameters();
			await this.save({
				title: title,
				data: data
			});
			return this.buildModel({url: returl});
		} catch(e) {
			throw e;
		}
	}

}
