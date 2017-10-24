const SourceFile = load('common.SourceFileGithub');
const Utils = load('common.Utils');
const BizShared = load('common.BizShared');

module.exports = (request, response) => {
	const renderPage = (result) => {
		response.render(result.template, result.result);
	};

	const renderError = (error) => {
		if (error.type === 'redirect') {
			response.redirect(error.url);
		} else {
			Utils.log(request.originalUrl, error.message);
			response.render('page/error', BizShared.buildErrorModel());
		}
	};

	(async () => {
		try {
			const controller = new ModifySectionGetController(request);
			const result = await controller.run();
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
}

class ModifySectionGetController {
	constructor(request) {
		this.request = request;
		this.params = {};
		this.result = {};
	}

	parseParameters() {
		try {
			const request = this.request;

			// URL: name
			this.params.algoName = request.params.name;

			// URL: step
			const Sections = SourceFile.Sections;
			let found = false;
			for (let section in Sections) {
				if (Sections[section].toLowerCase() === request.params.step) {
					found = true;
					break;
				}
			}
			if (request.params.step === 'name') {
				found = true;
			}
			if (!found) {
				throw new Error('Invalid URL parameters');
			}
			this.params.step = request.params.step;

			return {};
		} catch(e) {
			Utils.log('ModifySectionGetController.parseParameters', e);
			throw new Error('Internal Error')
		}
	}

	async loadAlgoFile() {
		try {
			const sourceFile = new SourceFile.File();
			this.result.source = sourceFile;

			const result = await sourceFile.loadFromFile(this.params.algoName);
			if (result.new) {
				sourceFile.createDefaultContent(this.params.algoName);
			}
			return {isNew: result.new};
		} catch(e) {
			Utils.log('ModifySectionGetController.loadAlgoFile', e);
			throw new Error('Internal Error');
		}
	}

	buildResult() {
		try {
			const siteConfig = loadConfig('site').config;
			const apiConfig = loadConfig('api');
			const pageTitle = `${siteConfig.title} - ${this.result.source.title} - Edit`;
			const tags = this.result.source.tags.join(',');
			const steps = BizShared.buildSteps();
			const allTags = BizShared.getAlgoTags();

			return {
				template: this.params.step === 'name'? 'page/name': 'page/section',
				result: {
					site: siteConfig,
					api: apiConfig,
					customTitle: pageTitle,
					step: this.params.step,
					steps: steps,
					algoName: this.result.source.getTitle(),
					algoTags: tags,
					tagList: this.result.source.tags,
					allTags: allTags,
					algoContent: this.result.source.toString(),
					algoMod: this.result.source.getSection(this.params.step),
					isNew: this.result.isNew
				}
			};
		} catch (e) {
			Utils.log('ModifySectionGetController.buildResult', e);
			throw new Error('Internal Error');
		}
	}

	async run() {
		try {
			this.parseParameters();
			const loadResult = await this.loadAlgoFile();
			this.result.isNew = loadResult.isNew;
			if (loadResult.isNew && this.params.step !== 'name') {
				const url = '/' + this.params.algoName + '/name';
				throw {type:'redirect', url:url};
			}
			return this.buildResult();
		} catch(e) {
			throw e;
		}
	}

}
