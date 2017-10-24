const Utils = load('common.Utils');
const Comment = load('common.CommentGithub');

module.exports = (request, response) => {
	const renderPage = (result) => {
		response.send({
			status: true,
			result: result
		});
	};

	const renderError = (error) => {
		Utils.log(request.originalUrl, error.message || error);
		response.send({
			status: false
		});
	};

	(async () => {
		try {
			const controller = new CommentAddController(request);
			const result = await controller.run();
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
};

class CommentAddController {
	constructor(request) {
		this.request = request;
	}

	parseParameters() {
		try {
			const reqBody = this.request.body;

			if (!reqBody.page || !reqBody.author || !reqBody.content) {
				throw new Error('Invalid request body');
			}

			return {page: reqBody.page, author: reqBody.author, content: reqBody.content};
		} catch(e) {
			Utils.log('CommentAddController.parseParameters', e.message || e);
			Utils.log('CommentAddController.parseParameters', e.stack || 'No stack');
			throw e;
		}
	}

	async save({page, author, content}) {
		try {
			const comment = new Comment();
			const {sha} = await comment.save({
				page: page,
				author: author,
				content: content
			});
			return {sha: sha};
		} catch(e) {
			Utils.log('CommentAddController.save', e.message || e);
			Utils.log('CommentAddController.save', e.stack || 'No stack');
			throw e;
		}
	}

	buildModel({sha}) {
		return {
			sha: sha
		};
	}

	async run() {
		try {
			const {page, author, content} = this.parseParameters();
			const {sha} = await this.save({
				page: page,
				author: author,
				content: content
			});
			return this.buildModel({sha: sha});
		} catch(e) {
			throw e;
		}
	}

}





