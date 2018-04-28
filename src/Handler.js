const fs = require('fs')

function RequestHandler( request, response, endpoint ) {
  var self = this;

  this.endpoint = endpoint
  this.params   = this.parseParams( request.url )
  this.body     = request.body
  this.request  = request
  this.response = response
  this.status   = 200
  
  var params = this.body == undefined ? {} : this.body
  for ( var key in this.params ) {
    params[key] = this.params[key]
  }

  if ( typeof params.method != "undefined" ) {
    this.endpoint[params.method].call( this, params )
  } else {
    this.endpoint[this.request.method].call( this, params )
  }
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
RequestHandler.prototype.respond = function(res, status) {
  if ( status != undefined ) { this.status = status }
  this.response.status(this.status)
  this.response.send(res)
  this.response.end()
}

module.exports = RequestHandler