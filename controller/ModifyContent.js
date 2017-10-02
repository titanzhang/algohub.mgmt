module.exports = function(request, response) {
	var renderPage = function(result) {
		response.render(result.template, result.result);
	};

	var renderError = function(error) {
		response.send({
			status: false,
			message: error.message
		});
	};

	controller = new ModifyContentController(request);
	controller.run()
		.then(renderPage)
		.catch(renderError);
}

var ModifyContentController = function(request) {
	this.request = request;
	this.params = {};
	this.result = {};

	const Sections = load('common.SourceFile').Sections;
	this.sectionText = {'name': 'Name/Tags'};
	this.sectionText[Sections.DESC] = 'Description';
	this.sectionText[Sections.COMP] = 'Complexity';
	this.sectionText[Sections.PCODE] = 'Pseudo Code';
}

ModifyContentController.prototype.parseParameters = function() {
	try {
		const request = this.request;
		// URL: action
		const validActions = ['add', 'edit'];
		if (validActions.indexOf(request.params.action) < 0) {
			return Promise.reject({message: 'Invalid URL parameters'});
		}
		this.params.action = request.params.action;

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

		if (request.method === 'POST') {
			// BODY: tags
			const tags = request.body.algoTags;
			this.params.algoTags = (tags === undefined)? []: tags.split(',');
			for (let i in this.params.algoTags) {
				this.params.algoTags[i] = this.params.algoTags[i].trim();
			}

			// BODY: contents
			this.params.algoAll = request.body.algoAll;

			// BODY: modefined section
			this.params.algoSection = request.body.algoSection;
			this.params.algoMod = request.body.algoMod;
		}

		return Promise.resolve({});
	} catch(e) {
		load('common.Utils').log('ModifyContentController.parseParameters', e);
		return Promise.reject({message:'Internal Error'});
	}
};

// Call this in a GET request
ModifyContentController.prototype.loadAlgoFile = function() {
	try {
		const SourceFile = load('common.SourceFile');
		const sourceFile = new SourceFile.File();
		this.result.source = sourceFile;

		return sourceFile.loadFromFile(this.params.algoName)
			.then( (result) => {
				return Promise.resolve({isNew: result.new});
			});
	} catch(e) {
		load('common.Utils').log('ModifyContentController.loadAlgoFile', e);
		return Promise.reject({message: 'Internal Error'});
	}

};

ModifyContentController.prototype.applyChanges = function() {
	try {
		if (this.params.algoTags !== undefined) {
			this.result.source.tags = this.params.algoTags;
		}
	} catch(e) {
		load('common.Utils').log('ModifyContentController.applyChanges', e);
		return Promise.reject({message: 'Internal Error'});
	}
};

ModifyContentController.prototype.buildResult = function() {
	const siteConfig = loadConfig('site').config;
	const pageTitle = siteConfig.title + ' - ' + this.result.source.head.title + ' - Edit';
	
	let tags = '';
	const tagList = (this.params.algoTags === undefined)? this.result.source.head.tags: this.params.algoTags;
	for (let i in tagList) {
		if (i > 0) tags += ',';
		tags += tagList[i];
	}

	let steps = [{name:'name', title:this.sectionText.name}];
	const SectionOrder = load('common.SourceFile').SectionOrder;
	for (let i in SectionOrder) {
		const key = SectionOrder[i];
		steps.push({name: key, title: this.sectionText[key]});
	}

	let model = {
		template: this.params.step === 'name'? 'page/name': 'page/modify',
		result: {
			site: siteConfig,
			customTitle: pageTitle,
			step: this.params.step,
			steps: steps,
			algoName: this.result.source.head.title,
			algoTags: tags,
			algoContent: this.result.source.toString(),
			algoMod: this.result.source.sections[this.params.step]
		}
	};

	return Promise.resolve(model);
};

ModifyContentController.prototype.run = function() {
	try {
		const self = this;
		return this.parseParameters()
			.then(this.loadAlgoFile.bind(this))
			.then( (loadResult) => {
				if ((self.params.action === 'edit' && loadResult.isNew) ||
					(self.params.action === 'add' && !loadResult.isNew)) {
					//TODO: handle inconsistent logic
				}
				return Promise.resolve({});
			})
			.then(this.buildResult.bind(this));
	} catch(e) {
		return Promise.reject(e);
	}
}