module.exports = function(request, response) {
	var renderPage = function(result) {
		response.send({
			status: true,
			result: result
		});
	};

	var renderError = function(error) {
		response.send({
			status: false,
			message: error.message
		});
	};

	controller = new SaveController(request);
	controller.run()
		.then(renderPage)
		.catch(renderError);
}

var SaveController = function(request) {
	this.request = request;
	this.params = {};
	this.result = {};
}

SaveController.prototype.parseParameters = function() {
	try {
		const request = this.request;

		// From section page
		// algoAll
		if (request.body.algoAll !== undefined) {
			this.params.algoAll = request.body.algoAll;
		}
		// algoSection
		if (request.body.algoSection !== undefined) {
			this.params.algoSection = request.body.algoSection;
		}
		// algoMod
		if (request.body.algoMod !== undefined) {
			this.params.algoMod = request.body.algoMod;
		}

		// From name page
		// algoName
		if (request.body.algoName !== undefined) {
			this.params.algoName = request.body.algoName;
		}
		// algoTags
		if (request.body.algoTags !== undefined) {
			this.params.algoTags = [];
			const tagList = request.body.algoTags.split(',');
			for (let i in tagList) {
				this.params.algoTags.push(tagList[i].trim());
			}
		}

		return Promise.resolve({});
	} catch(e) {
		load('common.Utils').log('SaveController.parseParameters', e);
		return Promise.reject({message:'Internal Error'});
	}
};

SaveController.prototype.applyChanges = function() {
	try {
		const self = this;
		const SourceFile = load('common.SourceFile');
		const sourceFile = new SourceFile.File();
		this.result.source = sourceFile;

		if (this.params.algoAll === undefined) {
			return load('common.Git').Git.updateLocal()
				.then( () => {
					return sourceFile.loadFromFile(this.params.algoName)
				})
				.then( (result) => {
					if (self.params.algoTags !== undefined) {
						sourceFile.setTags(self.params.algoTags);
					}
					return Promise.resolve({});
				});
		} else {
			if (!sourceFile.loadFromString(this.params.algoAll)) {
				return Promise.reject({message: 'Format error'});
			}
			if (self.params.algoTags !== undefined) {
				sourceFile.setTags(self.params.algoTags);
			}
			sourceFile.setSection(this.params.algoSection, this.params.algoMod);
			return Promise.resolve({});
		}

	} catch(e) {
		load('common.Utils').log('SaveController.applyChanges', e);
		return Promise.reject({message: 'Internal Error'});
	}

};

SaveController.prototype.saveFile = function() {
	try {
		const sourceFile = this.result.source;
		const Git = load('common.Git').Git;

		return Git.updateLocal()
			.then(sourceFile.save.bind(sourceFile))
			.then( () => {
				return Git.commit(sourceFile.getRelativePath());
			})
			.then( () => {
				return Git.push();
			});
	} catch(e) {
		load('common.Utils').log('SaveController.applyChanges', e);
		return Promise.reject({message: 'Internal Error'});
	}
};

SaveController.prototype.buildResult = function() {
	const siteConfig = loadConfig('site').config;
	const link = siteConfig.articlepool + '/' + this.result.source.algoToFileName(this.result.source.head.title) + '.html';

	return Promise.resolve({link: link});
};


SaveController.prototype.run = function() {
	try {
		return Promise.resolve()
			.then(this.parseParameters.bind(this))
			.then(this.applyChanges.bind(this))
			.then(this.saveFile.bind(this))
			.then(this.buildResult.bind(this));
	} catch(e) {
		return Promise.reject(e);
	}
}