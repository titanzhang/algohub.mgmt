const Github = load('common.Github');
const yaml = require('js-yaml');

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
	[Sections.APP]: 'Applications'
};

const SourceTemplate = {
	header: {
		layout: 'algo',
		index: true,
		comments: true,
		title: '',
		tags: [],
		modifier: 'admin',
		modtime: new Date().toISOString()
	},

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
		this.sha = undefined;
		this.createDefaultContent();
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

	set modifier(m) { this.head.modifier = (m || 'admin'); }
	set modtime(d) { this.head.modtime = (d.toISOString() || new Date().toISOString()); }

	set metaData(m) { this.sha = m.sha; }
	get metaData() { return {sha: this.sha}; }

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

	createDefaultContent(algoName) {
		this.head = SourceTemplate.header;
		this.head.title = algoName || '';

		this.sections = {};
		for (let i in Sections) {
			this.sections[Sections[i]] = '';
		}
	}

	loadFromString(stringContent) { return this.parse(stringContent); }

	toString({noHeader, noContent, noFooter} = {}) {
		// Header
		let header = '';
		if (!noHeader) {
			header = `---\n${yaml.safeDump(this.head)}\n---\n`;
		}

		// Contents
		let contents = '';
		if (!noContent) {
			for (const sectionName of SectionOrder) {
				const sectionContent = this.sections[sectionName];

				let section = SourceTemplate.section;
				section = section.replace('{name}', sectionName);
				section = sectionContent === undefined? '': section.replace('{content}', sectionContent);
				contents += section;
			}
		}

		// Footer
		let footer = '';
		if (!noFooter) {
			footer = SourceTemplate.footer;
		}

		return (header + contents + footer).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	}

	getDigest() {
		const header = yaml.safeDump({title: this.title, tags: this.tags});
		const content = this.toString({noHeader:true, noFooter:true});
		return require('crypto').createHash('md5').update(`${header}${content}`).digest('hex');
	}

	getFilePath(algoName) {
		if (algoName === undefined) algoName = this.head.title;
		return require('path').join(this.path, this.algoToFileName(algoName) + '.md');
	}

	async loadFromFile(algoName) {
		try {
			algoName = algoName || this.title;
			if (!algoName) throw new Error('SourceFile.loadFromFile::alogName is empty');

			const github = new Github();

			const data = await github.readFile(this.getFilePath(algoName));
			if (!data) {
				// this.createDefaultContent(algoName);
				return {new: true};
			} else {
				if (this.parse(data.content)) {
					this.sha = data.sha;
					return {new: false};
				} else {
					throw new Error('SourceFile.loadFromFile::Invalid file format');
				}
			}
		} catch(e) {
			throw e;
		}
	}

	parse(stringContent) {
		try {
			// Parse head
			const match = stringContent.match(/---([\s\S]*?)---/);
			if (!match) return false;
			const parseHead = yaml.safeLoad(match[1]);

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

	async save(message) {
		try {
			const github = new Github();
			let data;
			if (!this.sha) {
				data = await github.createFile(this.getFilePath(), this.toString(), this.head.modifier, message);
			} else {
				data = await github.updateFile(this.getFilePath(), this.sha, this.toString(), this.head.modifier, message);
			}
			this.sha = data.sha;
			return {sha: data.sha};
		} catch(e) {
			throw e;
		}
	}

	copy(sourceFile) {
		if (!this.parse(sourceFile.toString())) throw new Error('SourceFile.copy::Invalid source file');
		this.metaData = sourceFile.metaData;
	}
}

module.exports.File = SourceFile;
module.exports.Sections = Sections;
module.exports.SectionOrder = SectionOrder;
module.exports.SectionText = SectionText;
