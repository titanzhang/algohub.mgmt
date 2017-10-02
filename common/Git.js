var Git = {};
var nodegit = require('nodegit');
var gitconfig = loadConfig('git').config;

Git.updateLocal = function() {
	try {
		return nodegit.Repository.open(getSourcePath())
			.catch( () => {
				return nodegit.Clone(gitconfig.url, getSourcePath(), {});
			})
			.then( (repo) => {
				// Overwrite the local with latest remote
				// git fetch
				// git reset --hard origin/master
				return repo.fetch(gitconfig.remote, {})
					.then( () => {
						return repo.getBranchCommit(gitconfig.remote + '/' + gitconfig.branch);
					})
					.then( (remoteHead) => {
						const Reset = nodegit.Reset;
						return Reset.reset(repo, remoteHead, Reset.TYPE.HARD);
					});
			});
	} catch(e) {
		load('common.Utils').log('Git.updateLocal', e);
		return Promise.reject(e);
	}
};

module.exports.updateLocal = Git.updateLocal;