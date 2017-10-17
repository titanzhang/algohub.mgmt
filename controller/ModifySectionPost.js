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

	controller = new ModifySectionPostController(request);
	controller.run()
		.then(renderPage)
		.catch(renderError);
}

var ModifySectionPostController = function(request) {
	this.request = request;
	this.params = {};
	this.result = {};
}

ModifySectionPostController.prototype.parseParameters = function() {
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
			return Promise.reject({message: 'Invalid URL parameters'});
		}
		this.params.step = request.params.step;

		// From name page
		// BODY: algoTags
		if (request.body.algoTags !== undefined) {
			this.params.algoTags = [];
			const tagList = request.body.algoTags.split(',');
			for (let i in tagList) {
				this.params.algoTags.push(tagList[i].trim());
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

		return Promise.resolve({});
	} catch(e) {
		load('common.Utils').log('ModifySectionPostController.parseParameters', e);
		return Promise.reject({message:'Internal Error'});
	}
};

ModifySectionPostController.prototype.applyChanges = function() {
	try {
		const self = this;
		const SourceFile = load('common.SourceFile');
		const sourceFile = new SourceFile.File();
		this.result.source = sourceFile;
		this.result.isNew = false;

		if (this.params.algoAll === undefined) {
			return load('common.Git').Git.updateLocal()
				.then( () => {
					return sourceFile.loadFromFile(this.params.algoName)					
				})
				.then( (result) => {
					if (result.new) {
						self.result.isNew = true;
					}
					if (self.params.algoTags !== undefined) {
						sourceFile.setTags(self.params.algoTags);
					}
					return {};
				});
		} else {
			if (!sourceFile.loadFromString(this.params.algoAll)) {
				return Promise.reject({message: 'Format error'});
			}
			sourceFile.setSection(this.params.algoSection, this.params.algoMod);
			if (self.params.algoTags !== undefined) {
				sourceFile.setTags(self.params.algoTags);
			}
			return {};
		}

	} catch(e) {
		load('common.Utils').log('ModifySectionPostController.applyChanges', e);
		return Promise.reject({message: 'Internal Error'});
	}

};

ModifySectionPostController.prototype.buildResult = function() {
	const siteConfig = loadConfig('site').config;
	const pageTitle = siteConfig.title + ' - ' + this.result.source.getTitle() + ' - Edit';
	
	let tags = '';
	const tagList = this.result.source.getTags();
	for (let i in tagList) {
		if (i > 0) tags += ',';
		tags += tagList[i];
	}

	let steps = load('common.BizShared').buildSteps();
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
};

ModifySectionPostController.prototype.run = function() {
	try {
		const self = this;
		return this.parseParameters()
			.then(this.applyChanges.bind(this))
			.then(this.buildResult.bind(this));
	} catch(e) {
		return Promise.reject(e);
	}
}