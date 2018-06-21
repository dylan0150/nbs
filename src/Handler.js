const fs = require('fs')

/**
 * Request Handler
 * 
 * 1. Parses request body, urlParams and pathParams
 * 2. Passes them to an endpoint in priority of url > path > body 
 * 
 * @example endpoint.module.exports = { GET: function(params) {}, POST: function(params) {}, ?method=__name__: function(params) {} }
 * 
 * @param {express.request}  request 
 * @param {express.response} response 
 * @param {object}           endpoint 
 * @param {nbs.Server}       server 
 */
function RequestHandler(request, response, endpoint, server) {
    const self = this;

    this.server   = server
    this.endpoint = endpoint
    this.body     = request.body == undefined ? {} : request.body;
    this.params   = this.parseParams(request.url)
    this.request  = request
    this.response = response
    this.status   = 200
    this.set      = false
    this.cookies  = request.cookies

    var params = this.body
    for (var key in this.request.params) {
        params[key] = this.request.params[key]
    }
    for (var key in this.params) {
        params[key] = this.params[key]
    }

    var method = params.method === undefined
        ? request.method
        : params.method;
        
    if ( endpoint[method] instanceof Function ) {
        endpoint[method].call(this, params)
    } else {
        response.status(404).end()
    }
}
RequestHandler.prototype.parseParams = function (url) {
    var obj = {}
    if (url.split('?').length > 1) {
        var params = url.split('?')[1].split('&')
        for (var i = 0; i < params.length; i++) {
            obj[params[i].split('=')[0]] = params[i].split('=')[1]
        }
    }
    return obj
}
RequestHandler.prototype.respond = function (res, status) {
    try {
        this.send(res, status)
    } catch (e) {
        console.log(e)
    }
    this.end()
}
RequestHandler.prototype.cookie = function(id, cookie, options) {
    if ( options == undefined ) {
        options = this.server.auth.cookie_options
    }
    this.response.cookie(id, cookie, options)
}
RequestHandler.prototype.send = function (data, status) {
    if (!this.set) {
        if (status != undefined) {
            this.status = status
        }
        this.response.status(this.status)
    }
    this.set = true
    this.response.send(data)
}
RequestHandler.prototype.end = function () {
    try {
        this.response.end()
    } catch (e) {
        console.log(e)
    }
}

module.exports = RequestHandler