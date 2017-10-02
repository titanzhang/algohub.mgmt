module.exports = function(request, response) {
	const controller = new AddController();
	controller.run()
		.then( (result) => {
			response.render(result.template, result.result);
		})
		.catch( (error) => {
			//TODO: error page
		});
};

var AddController = function() {
	const Sections = load('common.SourceFile').Sections;
	this.sectionText = {};
	this.sectionText['name'] = 'Name/Tags';
	this.sectionText[Sections.DESC] = 'Description';
	this.sectionText[Sections.COMP] = 'Complexity';
	this.sectionText[Sections.PCODE] = 'Pseudo Code';
};

AddController.prototype.run = function() {
	const siteConfig = loadConfig('site').config;
	const pageTitle = siteConfig.title + ' - New';

	let steps = [{name:'name', title:this.sectionText.name}];
	const SectionOrder = load('common.SourceFile').SectionOrder;
	for (let i in SectionOrder) {
		const key = SectionOrder[i];
		steps.push({name: key, title: this.sectionText[key]});
	}

	return Promise.resolve({
		template: 'page/name',
		result: {
			site: siteConfig,
			customTitle: pageTitle,
			steps: steps,
			isNew: true
		}
	});
}