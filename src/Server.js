const express      = require('express')
const bodyParser   = require('body-parser')
const cookieParser = require('cookie-parser')
const EventEmitter = require('events');

const tk           = require('./Toolkit')
const Handler      = require('./Handler')
const Auth         = require('./Auth')

/**
 * Server Class
 * 
 * @param {object} config 
 * @example
	{
		host: {
			port: 8080
		},
		webroot: "www",
		response_headers: {
			"Access-Control-Allow-Origin": "*"
		},
		auth: {
			cookie_name: "auth",
			cookie_options: {
				maxAge: 1000*60*60
			},
			keys: {
				aes: fs.readFileSync("/.keys/aes", 'UTF-8')
			},
			public_urls: ['/api/login', '/api/register']
		}
	}
 * 
 * @param {tk.Deferrer} defer 
 */
const Server = function(config, defer) {
	EventEmitter.call(this)

	const self = this
	const app  = express()

	if ( defer == undefined ) {
		defer = new tk.Deferrer()
	}

	if ( config.webroot != undefined ) {
		app.use(express.static(config.webroot))
	}
	
	app.use(bodyParser.json())
	app.use(cookieParser())
	app.use(function(request, response, next) {
		for ( var header in config.response_headers ) {
		  	response.header( header, config.response_headers[header] )
		}
		next()
	})

	app.options('*', function(request, response) { response.status(200).end() })
	app.listen(config.host.port, defer.wait())

	defer.once('done', function() {
		self.emit("ready")
	})

	this.app     = app
	this.config  = config
	this.express = express
}
Server.prototype = new EventEmitter()
Server.prototype.constructor = Server
Server.prototype.route = function(method, path, endpoint) {
	if (typeof endpoint == "string") {
		endpoint = require(process.cwd()+endpoint)
	} else if (endpoint == undefined) {
		endpoint = require(process.cwd()+path)
	}
	const self = this;
	this.app[method](path, function(request, response) {
		new Handler( request, response, endpoint, self.config.response_headers )
	})
}
Server.prototype.initAuth = function(auth_config) {

	if ( auth_config != undefined ) {
		this.config.auth = auth_config
	}

	this.auth = new Auth(this.config.auth)

	this.app.use(function(request, response, next) {
		if ( !this.config.auth.public_urls.includes(request.url) ) {
			var authentication_token = request.cookies[this.config.auth.cookie_name]
			var new_token            = this.auth.refreshToken( authentication_token )
			if ( new_token == null || new_token == undefined ) {
				response.status(401).end()
			}
			response.cookie(this.config.auth.cookie_name, new_token, this.config.auth.cookie_options)
		}

		next()
	})
}

module.exports = Server