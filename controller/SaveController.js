const SourceFile = load('common.SourceFileGithub');
const Utils = load('common.Utils');
const BizShared = load('common.BizShared');
const Curl = load('common.Curl');

module.exports = (request, response) => {
	const renderPage = (result) => {
		response.send({
			status: true,
			result: result
		});
	};

	const renderError = (error) => {
		Utils.log(request.originalUrl, error.message);
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

	parseParameters() {
		try {
			const request = this.request;

			if (request.body.algoModifier !== undefined) {
				this.params.modifier = request.body.algoModifier.trim();
			}

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
				this.params.algoName = request.body.algoName.trim();
			}
			// algoTags
			if (request.body.algoTags !== undefined) {
				this.params.algoTags = [];
				const tagList = request.body.algoTags.split(',');
				for (let v of tagList) {
					this.params.algoTags.push(v.trim());
				}
			}

			if (!this.params.algoAll && !this.params.algoName) {
				throw new Error('Content and Name are both empty');
			}

		} catch(e) {
			Utils.log('SaveController.parseParameters', e);
			throw new Error('Internal Error');
		}
	}

	async applyChanges() {
		try {
			const sourceFile = new SourceFile.File();
			this.result.source = sourceFile;

			// Get algoName by parsing content or through parameter
			let algoName;
			if (this.params.algoAll) {
				if (!sourceFile.loadFromString(this.params.algoAll)) {
					throw new Error('SaveController.applyChange::Format error');
				}
				algoName = sourceFile.title;
			} else if (this.params.algoName) {
				algoName = this.params.algoName;
			} else {
				// Should not happen, already checked in parseParameters
				throw new Error('SaveController.applyChange::Empty file');
			}

			// Combine online/local contents
			const onlineFile = new SourceFile.File();
			const loadResult = await onlineFile.loadFromFile(algoName);
			if (!loadResult.new) {
				// Existing file
				if (this.params.algoAll) {
					sourceFile.metaData = onlineFile.metaData;
				} else {
					sourceFile.copy(onlineFile);
				}
			} else {
				// New file
				if (!this.params.algoAll) {
					sourceFile.createDefaultContent(algoName);
				} else {
					sourceFile.loadFromString(this.params.algoAll);
				}
			}

			if (this.params.algoTags !== undefined) {
				sourceFile.setTags(this.params.algoTags);
			}

			if ((this.params.algoMod !== undefined) && this.params.algoSection) {
				sourceFile.setSection(this.params.algoSection, this.params.algoMod);
			}

			sourceFile.modifier = this.params.modifier;
			sourceFile.modtime = new Date();

			// Check if something is changed
			return loadResult.new || (sourceFile.getDigest() !== onlineFile.getDigest());

		} catch(e) {
			Utils.log('SaveController.applyChanges', e);
			throw new Error('Internal Error');
		}
	}

	async saveFile() {
		try {
			await this.result.source.save();
		} catch(e) {
			Utils.log('SaveController.saveFile', e);
			throw new Error('Internal Error');
		}
	}

	async updateIndex() {
		let apiUrl;
		
		try {
			const link = encodeURIComponent(BizShared.buildArticleLink(this.result.source));
			const title = encodeURIComponent(this.result.source.title);
			const tags = encodeURIComponent(this.result.source.tags.join(','));
			apiUrl = loadConfig('api').searchUpdateAPI + '/' + link + '/' + title + '/' + tags;

			const httpReturn = await Curl.get(apiUrl, 2000);
			return JSON.parse(httpReturn.data).status;
		} catch(e) {
			Utils.log('SaveController.updateIndex', e.message);
			Utils.log('SaveController.updateIndex', apiUrl);
			return false;
		}
	}

	buildResult() {
		return {
			link: BizShared.buildArticleLink(this.result.source)
		};
	}

	async run() {
		try {
			this.parseParameters();
			const isChanged = await this.applyChanges();
			if (isChanged) {
				await Promise.all([this.saveFile(), this.updateIndex()]);
			}
			return this.buildResult();
		} catch(e) {
			throw e;
		}
	}

}





