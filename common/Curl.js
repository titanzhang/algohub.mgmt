
const Curl = {
	async get(urlString, timeout) {
		try {
			return this._get(urlString, timeout);
		} catch(response) {
			if (response.statusCode === undefined) {
				throw response;
			}

			if (response.statusCode === 301 || response.statusCode === 302) {
				return this._get(response.headers.location, timeout);
			} else {
				throw response;
			}
		}
	},

	_get(urlString, timeout) {
		return new Promise( (resolve, reject) => {
			const urlObj = require('url').parse(urlString);
			const httpClient = this._getClient(urlObj);

			urlObj.timeout = timeout;
			httpClient.get(urlObj, (response) => {
				const statusCode = response.statusCode;

				if (statusCode !== 200) {
					response.resume();
					return reject({
						statusCode: statusCode,
						headers: response.headers,
						message: 'Curl failed, status code: ' + statusCode
					});
				}

				response.setEncoding('utf8');
				let rawData = '';
				response.on('data', (chunk) => {
					rawData += chunk;
				})

				response.on('end', () => {
					resolve({
						headers: response.headers,
						data: rawData
					});
				});
			}).on('error', (e) => {
				reject({
					message: e.message
				});
			});
		});
	},

	post(urlString, postData, timeout, contentType) {
		return new Promise( (resolve, reject) => {
			const urlObj = require('url').parse(urlString);
			const httpClient = this._getClient(urlObj);

			urlObj.method = 'POST';
			urlObj.headers = {
				'Content-Type': contentType,
				'Content-Length': Buffer.byteLength(postData)
			};

			var req = httpClient.request(urlObj, (response) => {
				const statusCode = response.statusCode;

				if (statusCode !== 200) {
					response.resume();
					return reject({
						statusCode: statusCode,
						message: 'Request failed, status code: ' + statusCode
					});
				}

				response.setEncoding('utf8');
				let rawData = '';
				response.on('data', (chunk) => rawData += chunk);
				response.on('end', () => {
					resolve({
						headers: response.headers,
						data: rawData
					});
				});
			});

			req.on('error', (e) => {
				reject({ message: e.message});
			});

			req.write(postData);
			req.end();

		});
	},

	_getClient(urlObject) {
		if (urlObject.protocol === 'https:') {
			return require('https');
		} else {
			return require('http');
		}
	}

};

module.exports = Curl;
