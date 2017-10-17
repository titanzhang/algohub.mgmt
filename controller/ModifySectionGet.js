module.exports = function(request, response) {
	var renderPage = function(result) {
		response.render(result.template, result.result);
	};

	var renderError = function(error) {
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

	controller = new ModifySectionGetController(request);
	controller.run()
		.then(renderPage)
		.catch(renderError);
}

var ModifySectionGetController = function(request) {
	this.request = request;
	this.params = {};
	this.result = {};
}

ModifySectionGetController.prototype.parseParameters = function() {
	try {
		const request = this.request;

		// URL: name
		this.params.algoName = request.params.name;

		// URL: step
		Sections = load('common.SourceFile').Sections;
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
			return Promise.reject({message: 'Invalid URL parameters'});
		}
		this.params.step = request.params.step;

		return Promise.resolve({});
	} catch(e) {
		load('common.Utils').log('ModifySectionGetController.parseParameters', e);
		return Promise.reject({message:'Internal Error'});
	}
};

// Call this in a GET request
ModifySectionGetController.prototype.loadAlgoFile = function() {
	try {
		const self = this;
		const SourceFile = load('common.SourceFile');
		const sourceFile = new SourceFile.File();
		this.result.source = sourceFile;

		return load('common.Git').Git.updateLocal()
			.then( () => {
				return sourceFile.loadFromFile(self.params.algoName);
			})
			.then( (result) => {
				return {isNew: result.new};
			});
	} catch(e) {
		load('common.Utils').log('ModifySectionGetController.loadAlgoFile', e);
		return Promise.reject({message: 'Internal Error'});
	}

};

ModifySectionGetController.prototype.buildResult = function() {
	try {
		const siteConfig = loadConfig('site').config;
		const pageTitle = siteConfig.title + ' - ' + this.result.source.getTitle() + ' - Edit';
		
		let tags = '';
		const tagList = this.result.source.getTags();
		for (let i in tagList) {
			if (i > 0) tags += ',';
			tags += tagList[i];
		}

		const steps = load('common.BizShared').buildSteps();
		const allTags = load('common.BizShared').getAlgoTags();

		let model = {
			template: this.params.step === 'name'? 'page/name': 'page/section',
			result: {
				site: siteConfig,
				customTitle: pageTitle,
				step: this.params.step,
				steps: steps,
				algoName: this.result.source.getTitle(),
				algoTags: tags,
				tagList: tagList,
				allTags: allTags,
				algoContent: this.result.source.toString(),
				algoMod: this.result.source.getSection(this.params.step),
				isNew: this.result.isNew
			}
		};

		return Promise.resolve(model);
	} catch (e) {
		load('common.Utils').log('ModifySectionGetController.buildResult', e);
		return Promise.reject({message: 'Internal Error'});
	}
};

ModifySectionGetController.prototype.run = function() {
	try {
		const self = this;
		return this.parseParameters()
			.then(this.loadAlgoFile.bind(this))
			.then( (loadResult) => {
				self.result.isNew = loadResult.isNew;
				if (loadResult.isNew && self.params.step !== 'name') {
					const url = '/' + self.params.algoName + '/name';
					return Promise.reject({type:'redirect', url:url});
				}
				return Promise.resolve({});
			})
			.then(this.buildResult.bind(this));
	} catch(e) {
		return Promise.reject(e);
	}
}