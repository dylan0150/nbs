const mysql  = require('mysql')
const tk     = require('./Toolkit')

/**
 * Database Connection Pool Manager
 * 
 * @param {object{host,port,user,password,database...}} dbconfig - https://www.npmjs.com/package/mysql#connection-options
 */
function DB(dbconfig) {
	this.connections = []
	this.database = dbconfig.database
	this.config = dbconfig
}
DB.prototype.connect = function(callback) {
	var self = this
	var con = new Connection(callback, this.config)
	con.on('end', function() {
		self.cleanup()
	})
	this.connections.push(con)
	return this
}
DB.prototype.query = function(sql, params, callback) {
	var self = this
	var found_available_connection = false
	for ( var con of this.connections ) {
		if ( !con.connected ) {
			con.on('connect', function() { self.query(sql, params, callback) })
			return this;
		} else if ( con.available ) {
			found_available_connection = true;
			break;
		}
	}
	if ( !found_available_connection ) {
		this.connect(function() {
			self.query(sql, params, callback)
		})
		return this;
	}
	con.available = false;
	var query = con.connection.query( sql, params, function( error, results, fields ) {
		if (!error) {
			con.available = true
		}
		if ( callback instanceof Function ) { callback( error, results, fields, query, con.connection ) }	
	})
	return this
}
DB.prototype.cleanup = function() {
	for (var i = this.connections.length - 1; i >= 0; i--) {
		var con = this.connections[i]
		if ( con.timed_out ) {
			this.connections.splice(i,1)
			console.log('DB :: CLEANUP :: Connection Removed :: timeout')
		}
	}
}
DB.prototype.status = function() {
	console.log()
	console.log("DB :: STATUS")
	console.log("DATABASE "+this.database)
	var n = 1
	for ( var connection of this.connections ) {
		console.log("Connection: "+n+", Status: [ connected:"+connection.connected+", available:"+connection.available+" ]")
		n++
	}
	console.log()
}

function Connection(callback, config) {
	this.available  = false;
	this.connected  = false;
	this.timed_out  = false;
	this.events = {}
	this.connection = mysql.createConnection(config)
	this.connection.config.queryFormat = this.queryFormat

	var self = this
	this.connection.connect(function(error) {
		if ( !error ) {
			self.available = true
			self.connected = true
		} else if ( error.fatal ) {
			throw error;
		}
		self.event('connect')
		callback(error, self)
	})
	this.connection.on('error', function(err) {
		console.log('DB :: Connection :: ERR :: '+err.code)
		self.available = false;
		switch ( err.code ) {
			case 'PROTOCOL_CONNECTION_LOST':
				self.timed_out = true;
				self.event('end','timeout');
			break;
			default:
				console.trace('DB :: Connection :: ERR');
				console.error(err);
				self.connection.end(function(err) {
					if (err) { console.log(err) }
					self.timed_out = true;
					self.event('end','timeout');
				})
			break;
		}
	})
}
Connection.prototype.on = function(event, callback) {
	if ( typeof this.events[event] == 'undefined' ) { this.events[event] = [] }
	this.events[event].push(callback)
}
Connection.prototype.event = function(event, params) {
	if ( this.events[event] instanceof Array ) {
		for (var i = this.events[event].length - 1; i >= 0; i--) {
			var callback = this.events[event][i]
			if ( callback instanceof Function ) { callback(params) }
			this.events[event].splice(i,1)
		}
	}
}
Connection.prototype.queryFormat = function(query, values) {
	if (!values) { return query }
	return query.replace(/\:(\w+)/g, function (txt, key) {
	    if ( values.hasOwnProperty(key) ) {
	    	if ( typeof values[key] == 'string' ) { return this.escape(values[key]) }
	    	var param = values[key]
	    	if ( param.identifier ) { return this.escapeId( param.value ) }
	    	if ( param.date )       { return tk.parseDate( param.value ) }
	    }
	    return txt
	}.bind(this))
}

module.exports = DB