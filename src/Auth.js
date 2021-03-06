const crypto = require('crypto')
const aes    = require('aes256')
const uuid   = require('node-uuid')
const jwt    = require('jsonwebtoken')

const tk     = require('./Toolkit')

function Auth(config) {
	this.config = config
}
Auth.prototype.createToken = function(data, key) {
	if ( key == undefined ) {
		var jwt_key = this.config.keys.aes
	} else {
		var jwt_key = this.config.keys[key]
	}
	var session_expires = typeof this.config.session_expires == "undefined" ? 60*60 : this.config.session_expires;
	return jwt.sign({data:data}, jwt_key, {
		algorithm: "HS512",
		expiresIn: session_expires
	})
}
Auth.prototype.refreshToken = function(token, key) {
	let decoded = this.validateToken(token, key)
	if ( decoded == null ) { return null }
	return this.createToken(decoded, key)
}
Auth.prototype.validateToken = function(token, key) {
	if ( typeof key == "undefined" ) {
		var jwt_key = this.config.keys.aes
	} else {
		var jwt_key = this.config.keys[key]
	}
	var session_expires = this.config.session_expires == undefined ? 60*60 : this.config.session_expires;
	try {
		var decoded = jwt.verify( token, jwt_key, {
			algorithms: ["HS512"],
			maxAge: session_expires
		})
		return decoded.data
	} catch (e) {
		return null
	}
}
Auth.prototype.encrypt = function(string, key) {
	if ( typeof key == "undefined" ) {
		var aes_key = this.config.keys[key]
	} else {
		var aes_key = this.config.keys.aes
	}
	return aes.encrypt( aes_key, string )
}
Auth.prototype.decrypt = function(string, key) {
	if ( typeof key == "undefined" ) {
		var aes_key = this.config.keys[key]
	} else {
		var aes_key = this.config.keys.aes
	}
	return aes.decrypt( aes_key, string )
}
Auth.prototype.salthash = function(value) {
	var len  = typeof this.config.salt_length == "undefined" ? 16 : this.config.salt_length;
	var salt = crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len)
	return {
		salt: salt,
		hash: crypto.createHmac('sha512', salt).update(value).digest('hex')
	}
}

module.exports = Auth