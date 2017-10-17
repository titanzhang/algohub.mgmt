var BizShared = {};

BizShared.buildSteps = function() {
	const SourceFile = load('common.SourceFile');
	const sectionText = SourceFile.SectionText, SectionOrder = SourceFile.SectionOrder;

	let steps = [{name:'name', title:sectionText.name}];
	for (let i in SectionOrder) {
		const key = SectionOrder[i];
		steps.push({name: key, title: sectionText[key]});
	}
	return steps;
};

BizShared.buildArticleLink = function(sourceFile) {
	const siteConfig = loadConfig('site').config;
	return siteConfig.articlepool + '/algo/' + sourceFile.algoToFileName(sourceFile.getTitle()) + '.html';
};

BizShared.getAlgoTags = function() {
	return [
		'Divide and Conquer',
		'Greedy',
		'Dynamic Programming',
		'Approximation',
		'Search',
		'Sort',
		'Graph',
		'Other'
	];
};

module.exports.buildSteps = BizShared.buildSteps;
module.exports.buildArticleLink = BizShared.buildArticleLink;
module.exports.getAlgoTags = BizShared.getAlgoTags;