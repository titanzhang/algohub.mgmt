module.exports = (request, response) => {
	const renderPage = (result) => {
		response.send({
			status: true,
			result: result
		});
	};

	const renderError = (error) => {
		load('common.Utils').log(request.originalUrl, error.message);
		response.send({
			status: false,
			message: error.message
		});
	};

	(async () => {
		try {
			const controller = new SaveController(request);
			const result = await controller.run();
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
};

class SaveController {
	constructor(request) {
		this.request = request;
		this.params = {};
		this.result = {};
	}

	async parseParameters() {
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
				for (let v of tagList) {
					this.params.algoTags.push(v.trim());
				}
			}
		} catch(e) {
			load('common.Utils').log('SaveController.parseParameters', e);
			throw new Error('Internal Error');
		}
	}

	async applyChanges() {
		try {
			const SourceFile = load('common.SourceFile');
			const sourceFile = new SourceFile.File();
			this.result.source = sourceFile;

			if (this.params.algoAll === undefined) {
				await load('common.Git').Git.updateLocal();
				await sourceFile.loadFromFile(this.params.algoName);
				if (this.params.algoTags !== undefined) {
					sourceFile.setTags(this.params.algoTags);
				}
			} else {
				if (!sourceFile.loadFromString(this.params.algoAll)) {
					throw new Error('Format error');
				}
				if (this.params.algoTags !== undefined) {
					sourceFile.setTags(this.params.algoTags);
				}
				sourceFile.setSection(this.params.algoSection, this.params.algoMod);
			}
		} catch(e) {
			load('common.Utils').log('SaveController.applyChanges', e);
			throw new Error('Internal Error');
		}
	}

	async saveFile() {
		try {
			const sourceFile = this.result.source;
			const Git = load('common.Git').Git;

			await Git.updateLocal();
			await sourceFile.save();
			await Git.commit(sourceFile.getRelativePath());
			await Git.push();
		} catch(e) {
			load('common.Utils').log('SaveController.applyChanges', e);
			throw new Error('Internal Error');
		}
	}

	async buildResult() {
		return {
			link: load('common.BizShared').buildArticleLink(this.result.source)
		};
	}

	async run() {
		try {
			await this.parseParameters();
			await this.applyChanges();
			await this.saveFile();
			return this.buildResult();
		} catch(e) {
			throw e;
		}
	}

}





