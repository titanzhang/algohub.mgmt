var Utils = {};

Utils.log = (module, message)=> {
	const currentTime = new Date();
	console.log('[' + currentTime.toLocaleString('en-US', {hour12:false}) + '] ' + module + ': ' + message);
};

module.exports.log = Utils.log;