const express      = require('express')
const bodyParser   = require('body-parser')
const EventEmitter = require('events');

const tk          = require('./Toolkit')
const Handler     = require('./Handler')

const Server = function(config) {

	let self    = this

	const defer = new tk.Deferrer()
	const app   = express()

	app.use(express.static(config.webroot))
	app.use(bodyParser.json())
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
		endpoint = require(endpoint)
	}
	const self = this;
	this.app[method](path, function(request, response) {
		new Handler( request, response, endpoint, self.config.response_headers )
	})
}

module.exports = Server