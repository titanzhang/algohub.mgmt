// Deprecated
// 
var nodegit = require('nodegit');
var gitconfig = loadConfig('git').config;
var hostname = require('os').hostname();

var Git = {};

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

Git.commit = function(filePath) {
	try {
		let repo, index, oid;
		const name = 'algomgmt', email = name + '@' + hostname;

		return nodegit.Repository.open(getSourcePath())
			.then( (openResult) => {
				repo = openResult;
				return repo.refreshIndex();
			})
			.then( (indexResult) => {
				index = indexResult;
				return index.addByPath(filePath);
			})
			.then( () => {
				return index.write();
			})
			.then( () => {
				return index.writeTree();
			})
			.then( (oidResult) => {
				oid = oidResult;
				return nodegit.Reference.nameToId(repo, "HEAD");
			})
			.then( (head) => {
				return repo.getCommit(head);
			})
			.then( (parent) => {
				const d = new Date();
				const author = nodegit.Signature.create(name, email, d.getTime() / 1000, -d.getTimezoneOffset());

				return repo.createCommit("HEAD", author, author, "update", oid, [parent]);
			});
	} catch(e) {
		load('common.Utils').log('Git.commit', e);
		return Promise.reject(e);
	}
};

Git.push = function() {
	try {
		const self = this;

		return nodegit.Repository.open(getSourcePath())
			.then( (repo) => {
				return repo.getRemote(gitconfig.remote);
			})
			.then( (remote) => {
				return remote.push(["refs/heads/master:refs/heads/master"],
					{
						callbacks: {
							credentials: self.cred()
						}
					});
			})
	} catch(e) {
		load('common.Utils').log('Git.push', e);
		return Promise.reject(e);
	}
}

Git.cred = function() {
	const token = gitconfig.token;
	let tries = 0;

	const callback = function(url, userName) {
		if (tries ++ > 3) return nodegit.Cred.defaultNew();
		return nodegit.Cred.userpassPlaintextNew(token, 'x-oauth-basic');
	};
	return callback;
};

// module.exports.Git = Git;
