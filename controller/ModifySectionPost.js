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
			const controller = new ModifySectionPostController(request);
			const result = await controller.run();
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
}

class ModifySectionPostController {
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

			// From name page
			// BODY: algoTags
			if (request.body.algoTags !== undefined) {
				this.params.algoTags = [];
				const tagList = request.body.algoTags.split(',');
				for (let v of tagList) {
					this.params.algoTags.push(v.trim());
				}
			}

			// From section page
			// BODY: algoAll
			if (request.body.algoAll !== undefined) {
				this.params.algoAll = request.body.algoAll;
			}
			// BODY: algoSection
			// BODY: algoMod
			if (request.body.algoSection !== undefined) {
				this.params.algoSection = request.body.algoSection;
				this.params.algoMod = request.body.algoMod === undefined? '': request.body.algoMod;
			}
		} catch(e) {
			load('common.Utils').log('ModifySectionPostController.parseParameters', e);
			throw new Error('Internal Error');
		}
	}

	async applyChanges() {
		try {
			const SourceFile = load('common.SourceFile');
			const sourceFile = new SourceFile.File();
			this.result.source = sourceFile;
			this.result.isNew = false;

			if (this.params.algoAll === undefined) {
				await load('common.Git').Git.updateLocal();
				const loadResult = await sourceFile.loadFromFile(this.params.algoName);
				if (loadResult.new) {
					this.result.isNew = true;
				}
				if (this.params.algoTags !== undefined) {
					sourceFile.setTags(this.params.algoTags);
				}
			} else {
				if (!sourceFile.loadFromString(this.params.algoAll)) {
					throw new Error('Format error');
				}
				sourceFile.setSection(this.params.algoSection, this.params.algoMod);
				if (this.params.algoTags !== undefined) {
					sourceFile.setTags(this.params.algoTags);
				}
			}
		} catch(e) {
			load('common.Utils').log('ModifySectionPostController.applyChanges', e);
			throw new Error('Internal Error');
		}
	}


	async buildResult() {
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
	}

	async run() {
		try {
			await this.parseParameters();
			await this.applyChanges();
			return this.buildResult();
		} catch(e) {
			throw e;
		}
	}

}




