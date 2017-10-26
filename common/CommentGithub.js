const Github = load('common.Github');
const Utils = load('common.Utils');

class CommentGithub {
	constructor() {
		this.path = '_data/comments'
	}

	async save({page, author, content, date = new Date()}) {
		try {
			const github = new Github();
			const json = {
				author: author,
				content: content,
				date: date.toISOString()
			};
			const path = require('path').join(this.path, page.trim(), `Entry${date.getTime()}.json`);

			const data = await github.createFile(path, JSON.stringify(json));
			return {sha: data.sha};
		} catch(e) {
			Utils.log('CommentGithub.save', e.message || e);
			Utils.log('CommentGithub.save', e.stack || 'No stack');
			throw e;
		}
	}
}

module.exports = CommentGithub;
