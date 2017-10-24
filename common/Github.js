const GithubAPI = require('github');

class Github {
	constructor() {
		this.config = loadConfig('github').config;

		this.github = new GithubAPI({
		  host: this.config.host,
		  protocol: this.config.protocol,
		  headers: {
		    'user-agent': 'liang-gitapi'
		  },
		  followRedirects: false,
		  rejectUnauthorized: false,
		  debug: false,
		  Promise: Promise
		});

		this.github.authenticate({
			type: 'token',
			token: this.config.token
		});
	}

	async readFile(path) {
		try {
			const response = await this.github.repos.getContent({
			  owner: this.config.owner,
			  repo: this.config.repo,
			  path: path
			});

			const encoding = response.data.encoding;
			return {
				sha: response.data.sha,
				content: Buffer.from(response.data.content, encoding).toString('utf8')
			};
		} catch(e) {
			if (e.code == 404) {
				return false;
			} else {
				throw e;
			}
		}
	}

	async updateFile(path, sha, content, committer, message) {
		try {
			message = message || 'update content';
			committer = committer || 'githubapi';
			committer = {
				name: committer,
				email: committer
			};

			content = Buffer.from(content, 'utf8').toString('base64');

			const response = await this.github.repos.updateFile({
				owner: this.config.owner,
				repo: this.config.repo,
				path: path,
				message: message,
				content: content,
				sha: sha,
				committer: committer
			});

			return {sha: response.data.content.sha};
		} catch(e) {
			throw e;
		}
	}

	async createFile(path, content,committer, message) {
		try {
			message = message || 'update content';
			committer = committer || 'githubapi';
			committer = {
				name: committer,
				email: committer
			};

			content = Buffer.from(content, 'utf8').toString('base64');
			const response = await this.github.repos.createFile({
				owner: this.config.owner,
				repo: this.config.repo,
				path: path,
				message: message,
				content: content,
				committer: committer
			});

			return {sha: response.data.content.sha};
		} catch(e) {
			throw e;
		}
	}

}

module.exports = Github;
