
var Sections = {
	DESC: 'section_desc',
	COMP: 'section_complexity',
	PCODE: 'section_pseudocode',
	EDU: 'section_edu',
	APP: 'section_app'
};
var SectionOrder = [Sections.DESC, Sections.COMP, Sections.PCODE, Sections.EDU, Sections.APP];
var SectionText = {};
SectionText['name'] = 'Name/Tags';
SectionText[Sections.DESC] = 'Description';
SectionText[Sections.COMP] = 'Complexity';
SectionText[Sections.PCODE] = 'Pseudo Code';
SectionText[Sections.EDU] = 'Education';
SectionText[Sections.APP] = 'Applications';

var SourceTemplate = {
	header:
		'---\n' +
		'layout: algo\n' +
		'title: {title}\n' +
		'tags: [{tags}]\n' +
		'index: true\n' +
		'comments: true\n' +
		'---\n',

	section:
		'{% capture {name} %}' +
		'{content}' +
		'{% endcapture %}\n',

	footer:
		'{% include algo.html %}'
};

var SourceFile = function() {
	this.path = 'algo';
	this.head = {
		title: '',
		tags: []
	};
	this.sections = {};
	for (let i in Sections) {
		this.sections[Sections[i]] = '';
	}

};

SourceFile.prototype.setTags = function(tags) {
	if (tags === undefined || tags === null) return;
	this.head.tags = [];
	const myTags = this.head.tags;
	tags.forEach( (item) => {
		myTags.push(item);
	});
};

SourceFile.prototype.getTitle = function() {
	return this.head.title;
};

SourceFile.prototype.getTags = function() {
	return this.head.tags;
};

SourceFile.prototype.getSection = function(name) {
	return this.sections[name];
}

SourceFile.prototype.isSectionValid = function(name) {
	for (let i in Sections) {
		if (name === Sections[i]) return true;
	}
	return false;
};

SourceFile.prototype.setSection = function(name, content) {
	if (!this.isSectionValid(name)) return false;
	if (content === undefined || content === null) return false;
	this.sections[name] = content;

	return true;
};

SourceFile.prototype.algoToFileName = function(algoName) {
	algoName = algoName.replace(/ /g, '-');
	algoName = algoName.replace(/[^A-Za-z0-9-]/g, '');
	return algoName.toLowerCase();
};

SourceFile.prototype.getDefaultContent = function() {
	this.head = {
		title: '',
		tags: []
	};

	this.sections = {};
	for (let i in Sections) {
		this.sections[Sections[i]] = '';
	}
};

SourceFile.prototype.loadFromString = function(stringContent) {
	return this.parse(stringContent);
};

SourceFile.prototype.toString = function() {
	// Header
	let header = SourceTemplate.header;
	header = header.replace('{title}', this.head.title);
	let tags = '';
	for (let i in this.head.tags) {
		tags += (i > 0)? ', ': '';
		tags += this.head.tags[i];
	}
	header = header.replace('{tags}', tags);

	// Contents
	let contents = '';
	for (let i = 0; i < SectionOrder.length; i ++) {
		const sectionName = SectionOrder[i];
		const sectionContent = this.sections[sectionName];

		let section = SourceTemplate.section;
		section = section.replace('{name}', sectionName);
		section = sectionContent === undefined? '': section.replace('{content}', sectionContent);
		contents += section;
	}

	// Footer
	let footer = SourceTemplate.footer;

	return (header + contents + footer).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

SourceFile.prototype.loadDefault = function(algoName) {
	this.getDefaultContent();
	this.head.title = algoName;
};

SourceFile.prototype.getRelativePath = function(algoName) {
	if (algoName === undefined) algoName = this.head.title;
	return require('path').join(this.path, this.algoToFileName(algoName) + '.md');
};

SourceFile.prototype.getFilePath = function(algoName) {
	if (algoName === undefined) algoName = this.head.title;
	return require('path').resolve(getSourcePath(), this.getRelativePath(algoName));
};

SourceFile.prototype.loadFromFile = function(algoName) {
	return new Promise( (resolve, reject) => {
		const fileName = this.getFilePath(algoName);
		if (!require('fs').existsSync(fileName)) {
			this.loadDefault(algoName);
			return resolve({new: true});
		}

		require('fs').readFile(fileName, (err, data) => {
			if (err) {
				return reject(err);
			}

			if (this.parse(data.toString())) {
				resolve({new: false});
			} else {
				reject({message: 'SourceFile.loadFromFile: Parsing file failed'});
			}
		});
	});
};

SourceFile.prototype.parse = function(stringContent) {
	try {
		// Parse head
		const parseHead = {};
		let regexp = /---([\s\S]*)---/;
		let match = stringContent.match(regexp);
		if (!match) return false;
		match[1].split('\n').forEach( (item, index) => {
			if (item.trim().length < 1) return;
			const line = item.split(':');
			const name = line[0].trim();
			let value = line[1].trim();
			if (value[0] == '[') {
				value = value.substring(1, value.length-1);
				const values = value.split(',');
				value = []
				values.forEach( (v, i) => {
					value.push(v.trim());
				});
			}
			parseHead[name] = value;
		});

		// Parse sections
		const parseSections = [];
		for (let section in Sections) {
			const beginTag = '{% capture ' + Sections[section] + ' %}';
			const endTag = '{% endcapture %}';
			const beginIndex = stringContent.indexOf(beginTag);
			if (beginIndex >= 0) {
				const sectionContent = stringContent.substr(beginIndex + beginTag.length);
				const endIndex = sectionContent.indexOf(endTag);
				if (endIndex < 0) return false;
				parseSections[Sections[section]] = sectionContent.substring(0, endIndex).replace(/^\n|\n$/gm,'');
			} else {
				parseSections[Sections[section]] = '';
			}

		}

		this.head = parseHead;
		this.sections = parseSections;
		return true;
	} catch (e) {
		load('common.Utils').log('SourceFile.parse', e.message);
		return false;
	}
};

SourceFile.prototype.save = function() {
	return new Promise( (resolve, reject) => {
		const fileName = this.getFilePath();

		require('fs').writeFile(fileName, this.toString(), (err) => {
			if (err) {
				return reject(err);
			}

			return resolve({});
		});
	});

};

module.exports.File = SourceFile;
module.exports.Sections = Sections;
module.exports.SectionOrder = SectionOrder;
module.exports.SectionText = SectionText;
