const EventEmitter = require('events');

const body_parser  = require('body-parser')

function nbs_Server(port) {
	this.express = require('express')
	this.app     = express()
	this.app.listen(port, function() {
		this.emit("ready")
	})
}
Server.prototype = new EventEmitter();
Server.prototype.constructor = nbs_Server;

Server.prototype.static = function(path, custom_options) {
	var options = {
		dotfiles: "ignore",
		extensions: ["html"]
	} 
	if ( typeof custom_options == "object" ) {
		for ( var key in custom_options ) {
			options[key] = custom_options[key]
		}
	}
	this.app.use(this.express.static(path, options))
}

Server.prototype.api = function(path, options) {
	this.app.use(body_parser.json())
	this.app.use(function(request, response, next) {


		next()
	})
	this.app.options(path+'*', function(request, response) { response.status(200).end() })
	this.app.get(    path+'*', function(request, response) { new Server.RequestHandler(request, response) })
	this.app.post(   path+'*', function(request, response) { new Server.RequestHandler(request, response) })
}

Server.RequestHandler = function(request, response) {
	
}

module.exports = nbs_Server