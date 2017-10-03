global.baseDir = __dirname + "/";

global.load = function(moduleName) {
	const jsName = moduleName.replace(/\./g, "/");
	return require(baseDir + jsName);
}

global.loadConfig = function(configName) {
	let jsName = baseDir + '../config/mgmt/' + configName + '.js';
	if (!require('fs').existsSync(jsName)) {
		jsName = baseDir + 'config/' + configName + '.js';
	}
	return require(jsName);
}

global.getSourcePath = function() {
	return require("path").resolve(baseDir + '../site');
}