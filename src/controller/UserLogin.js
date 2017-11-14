module.exports = (request, response) => {
	const renderPage = (result) => {
		response.cookie('uid', result.userId, { maxAge: result.maxAge });
		response.cookie('ucred', result.cred, { maxAge: result.maxAge });
		response.send({
			status: true,
			result: result
		});
	};

	const renderError = (error) => {
		load('common.Utils').log(request.originalUrl, error.message);
		response.send({
			status: false,
			message: error.message
		});
	};

	(async () => {
		try {
			const controller = new UserLogin();
			const result = await controller.run(request);
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
};

class UserLogin {
	async run(request) {
		try {
			const params = await this.parseParameters(request);
			const userId = await this.login(params.username, params.password);
			return this.buildModel(userId);
		} catch(e) {
			throw e;
		}
	}

	async parseParameters(request) {
		try {
			const param = {};
			if (!request.body.username || request.body.username.trim().length == 0) {
				throw new Error('no username');
			}
			// if (!request.body.password || request.body.password.trim().length == 0) {
			// 	throw 'no password';
			// }

			param.username = request.body.username? request.body.username.trim(): '';
			param.password = request.body.password? request.body.password.trim(): '';

			return param;
		} catch(e) {
			throw e;
		}

	}

	async login(userName, password) {
		return userName;
	}

	async buildModel(userId) {
		return {
			userId: userId,
			cred: load('common.BizShared').createUserCredential(userId),
			maxAge: 1000 * 60 * 60 * 24 * 365
		};
	}
}