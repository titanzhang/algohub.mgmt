const Github = load('common.Github');
const Utils = load('common.Utils');
const slugify = require('slugify');

class SurveyGithub {
	constructor() {
		this.path = '_data/survey'
	}

	async save({title, data, date = new Date()}) {
		try {
			const github = new Github();
			const json = {
				title: title,
				date: date.toISOString()
			};

      for (let key in data) {
        json[key] = data[key];
      }

			const path = require('path').join(this.path, slugify(title.trim()), `Entry${date.getTime()}.json`);

			await github.createFile(path, JSON.stringify(json));
		} catch(e) {
			Utils.log('SurveyGithub.save', e.message || e);
			Utils.log('SurveyGithub.save', e.stack || 'No stack');
			throw e;
		}
	}
}

module.exports = SurveyGithub;
