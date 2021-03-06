const SourceFile = load('common.SourceFileGithub');

class BizShared {
	static buildSteps() {
		const sectionText = SourceFile.SectionText, SectionOrder = SourceFile.SectionOrder;

		let steps = [{name:'name', title:sectionText.name}];
		for (let i in SectionOrder) {
			const key = SectionOrder[i];
			steps.push({name: key, title: sectionText[key]});
		}
		return steps;
	}

	static buildArticleLink(sourceFile) {
		const siteConfig = loadConfig('site').config;
		return siteConfig.articlepool + '/algo/' + sourceFile.algoToFileName(sourceFile.getTitle()) + '.html';
	}

	static getAlgoTags() {
		return [
			'Divide and Conquer',
			'Greedy',
			'Dynamic Programming',
			'Approximation',
			'Search',
			'Sort'
		];
	}

	static createUserCredential(userId, sExpire) {
		const privatePart = 'algohubbuhogla';
		const expire = sExpire? Math.floor(new Date().getTime() / (sExpire * 1000)): '';
		return require('crypto').createHash('md5').update(userId + privatePart + expire).digest('hex');
	}

	static buildErrorModel(customTitle, errorTitle, errorMessage) {
		customTitle = customTitle || 'Page Error';
		errorTitle = errorTitle || 'This page is temporary unavailable';
		errorMessage = errorMessage || 'The page you visited may be broken, or under maintanence.';
		const pageName = 'general';
		return {
			site: loadConfig('site').config,
			pageName: pageName,
			customTitle: customTitle,
			errorTitle: errorTitle,
			errorMessage: errorMessage
		};
	}
};



module.exports.buildSteps = BizShared.buildSteps;
module.exports.buildArticleLink = BizShared.buildArticleLink;
module.exports.getAlgoTags = BizShared.getAlgoTags;
module.exports.createUserCredential = BizShared.createUserCredential;
module.exports.buildErrorModel = BizShared.buildErrorModel;