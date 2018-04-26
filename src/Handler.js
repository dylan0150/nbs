const fs = require('fs')

function RequestHandler( request, response, endpoint ) {
  var self = this;

  this.endpoint = require(endpoint)
	this.params   = this.parseParams( request.url )
  this.body     = request.body
	this.request  = request
	this.response = response
  this.status   = 200
  
  var params = this.body
  for ( var key in this.params ) {
    
  }

  if ( typeof params.method != "undefined" ) {
    this.endpoint[params.method].apply( this, params )
  }
}
RequestHandler.prototype.get = function() {
  if ( this.params.method ) {
    this.endpoint[this.params.method](this.params, this.headers.userData, this)
  } else {
    this.endpoint.get(this.params, this.headers.userData, this)
  }
  return this
}
RequestHandler.prototype.post = function() {
  for ( var key in this.body ) {
    this.params[key] = this.body[key]
  }
  if ( this.params.method ) {
    this.endpoint[this.params.method](this.params, this.headers.userData, this)
  } else {
    this.endpoint.post(this.params, this.headers.userData, this)
  }
  return this
}
RequestHandler.prototype.parseParams = function(url) {
  var obj = {}
  if (url.split('?').length > 1) {
    var params = url.split('?')[1].split('&')
    for (var i = 0; i < params.length; i++) {
      obj[params[i].split('=')[0]] = params[i].split('=')[1]
    }
  }
  return obj
}
RequestHandler.prototype.respond = function(response, status) {
  if ( status != undefined ) { this.status = status }
  this.response.status(this.status)
  this.response.send(response)
  this.response.end()
}

module.exports = RequestHandler