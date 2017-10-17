const Sections = {
	DESC: 'section_desc',
	COMP: 'section_complexity',
	PCODE: 'section_pseudocode',
	EDU: 'section_edu',
	APP: 'section_app'
};
const SectionOrder = [Sections.DESC, Sections.COMP, Sections.PCODE, Sections.EDU, Sections.APP];
const SectionText = {
	['name']: 'Name/Tags',
	[Sections.DESC]: 'Description',
	[Sections.COMP]: 'Complexity',
	[Sections.PCODE]: 'Pseudo Code',
	[Sections.EDU]: 'Education',
	[Sections.APP]: 'Applications',
};

const SourceTemplate = {
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

class SourceFile {
	constructor() {
		this.path = 'algo';
		this.head = {
			title: '',
			tags: []
		};
		this.sections = {};
		for (let i in Sections) {
			this.sections[Sections[i]] = '';
		}
	}

	setTags(tags) {
		if (tags === undefined || tags === null) return;
		this.head.tags = [];
		for (let v of tags) {
			this.head.tags.push(v);
		}
	}

	getTitle() { return this.head.title; }
	get title() { return this.getTitle(); }

	getTags() { return this.head.tags; }
	get tags() { return this.getTags(); }

	getSection(name) { return this.sections[name]; }

	isSectionValid(name) {
		for (let i in Sections) {
			if (name === Sections[i]) return true;
		}
		return false;
	}

	setSection(name, content) {
		if (!this.isSectionValid(name)) return false;
		if (content === undefined || content === null) return false;
		this.sections[name] = content;

		return true;
	}

	algoToFileName(algoName) {
		algoName = algoName.replace(/ /g, '-');
		algoName = algoName.replace(/[^A-Za-z0-9-]/g, '');
		return algoName.toLowerCase();
	}

	getDefaultContent() {
		this.head = {
			title: '',
			tags: []
		};

		this.sections = {};
		for (let i in Sections) {
			this.sections[Sections[i]] = '';
		}
	}

	loadFromString(stringContent) { return this.parse(stringContent); }

	toString() {
		// Header
		let header = SourceTemplate.header;
		header = header.replace('{title}', this.head.title);
		header = header.replace('{tags}', this.head.tags.join(','));

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
	}

	loadDefault(algoName) {
		this.getDefaultContent();
		this.head.title = algoName;
	}

	getRelativePath(algoName) {
		if (algoName === undefined) algoName = this.head.title;
		return require('path').join(this.path, this.algoToFileName(algoName) + '.md');
	}

	getFilePath(algoName) {
		if (algoName === undefined) algoName = this.head.title;
		return require('path').resolve(getSourcePath(), this.getRelativePath(algoName));
	}

	loadFromFile(algoName) {
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
	}

	parse(stringContent) {
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
	}

	save() {
		return new Promise( (resolve, reject) => {
			const fileName = this.getFilePath();

			require('fs').writeFile(fileName, this.toString(), (err) => {
				if (err) {
					return reject(err);
				}

				return resolve({});
			});
		});
	}

}

module.exports = {
	File: SourceFile,
	Sections: Sections,
	SectionOrder: SectionOrder,
	SectionText: SectionText
};
