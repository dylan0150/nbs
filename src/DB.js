const mysql  = require('mysql')
const tk     = require('./Toolkit')
const EventEmitter = require('events')

function DB(dbconfig) {
	this.connections = []
	this.database = dbconfig.database
	this.config = dbconfig
}
DB.prototype = new EventEmitter()
DB.prototype.constructor = DB
DB.prototype.connect = function(callback) {
	var self = this
	var con = new Connection(callback, this.config)
	this.log("connection.connect", con)
	con.on('end', function() {
		self.cleanup()
	})
	this.connections.push(con)
	return this
}
DB.prototype.query = function(sql, params, callback) {
	var this_db = this
	var found_available_connection = false
	for ( var con of this.connections ) {
		if ( !con.connected ) {
			con.on('connect', function() { this_db.query(sql, params, callback); this.log("query", sql); })
			return this;
		} else if ( con.available ) {
			found_available_connection = true;
			break;
		}
	}
	if ( !found_available_connection ) {
		this.connect(function() {
			this_db.query(sql, params, callback)
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
			this.log("connection.timeout", con)
		}
	}
}
DB.prototype.log = function(event, params) {
	this.emit(event, params)
}

function Connection(callback, config) {
	this.available  = false;
	this.connected  = false;
	this.timed_out  = false;
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
		self.emit('connect')
		callback(error, self)
	})
	this.connection.on('error', function(err) {
		this.log('DB :: Connection :: ERR :: '+err.code)
		self.available = false;
		switch ( err.code ) {
			case 'PROTOCOL_CONNECTION_LOST':
				self.timed_out = true;
				self.emit('end','timeout');
			break;
			default:
				console.trace('DB :: Connection :: ERR');
				console.error(err);
				self.connection.end(function(err) {
					if (err) { this.log(err) }
					self.timed_out = true;
					self.emit('end','timeout');
				})
			break;
		}
	})
}
Connection.prototype = new EventEmitter()
Connection.prototype.constructor = Connection
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
Connection.prototype.log = function(event, params) {
	this.emit(event, params)
}

module.exports = DB