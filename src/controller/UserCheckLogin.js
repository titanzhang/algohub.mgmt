module.exports = (request, response) => {
	const renderPage = (result) => {
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
			const controller = new UserCheckLogin();
			const result = await controller.run(request);
			renderPage(result);
		} catch(e) {
			renderError(e);
		}
	})();
};

class UserCheckLogin {
	async run(request) {
		try {
			const params = await this.parseParameters(request);
			const checkResult = await this.check(params.userId, params.userCredential);
			if (!checkResult) throw new Error('not login');
			return this.buildModel(params.userId, params.userCredential);
		} catch(e) {
			throw e;
		}
	}

	async parseParameters(request) {
		try {
			const param = {};
			param.userId = request.cookies.uid || '';
			param.userCredential = request.cookies.ucred || '';
			return param;
		} catch(e) {
			throw e;
		}

	}

	async check(userId, userCredential) {
		const validCred = load('common.BizShared').createUserCredential(userId);
		return validCred === userCredential;
	}

	async buildModel(userId, userCredential) {
		return {
			userId: userId,
			cred: userCredential,
			maxAge: 1000 * 60 * 60 * 24 * 365
		};
	}
}