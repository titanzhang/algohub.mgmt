module.exports = (request, response) => {
	const renderPage = (result) => {
		response.render(result.template, result.result);
	};

	const renderError = (error) => {
		if (error.type === 'redirect') {
			response.redirect(error.url);
		} else {
			load('common.Utils').log(request.originalUrl, error.message);
			response.render('page/error', {
				site: loadConfig('site').config,
				customTitle: 'Page Error',
				errorTitle: 'This page is temporary unavailable',
				errorMessage: 'The page you visited may be broken, or under maintanence.'
			});
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

	async parseParameters() {
		try {
			const request = this.request;

			// URL: name
			this.params.algoName = request.params.name;

			// URL: step
			const Sections = load('common.SourceFile').Sections;
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
			load('common.Utils').log('ModifySectionGetController.parseParameters', e);
			throw new Error('Internal Error')
		}
	}

	async loadAlgoFile() {
		try {
			const SourceFile = load('common.SourceFile').File;
			const sourceFile = new SourceFile();
			this.result.source = sourceFile;

			await load('common.Git').Git.updateLocal();
			const result = await sourceFile.loadFromFile(this.params.algoName);
			return {isNew: result.new};
		} catch(e) {
			load('common.Utils').log('ModifySectionGetController.loadAlgoFile', e);
			throw new Error('Internal Error');
		}
	}

	async buildResult() {
		try {
			const siteConfig = loadConfig('site').config;
			const pageTitle = siteConfig.title + ' - ' + this.result.source.getTitle() + ' - Edit';
			const tags = this.result.source.tags.join(',');
			const steps = load('common.BizShared').buildSteps();
			const allTags = load('common.BizShared').getAlgoTags();

			return {
				template: this.params.step === 'name'? 'page/name': 'page/section',
				result: {
					site: siteConfig,
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
			load('common.Utils').log('ModifySectionGetController.buildResult', e);
			throw new Error('Internal Error');
		}
	}

	async run() {
		try {
			await this.parseParameters();
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
