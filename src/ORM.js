const mysql  = require('mysql')

function ORM(db) {
	this.ready_tables = {}
	this.events = {}
	this.db = db
}
ORM.prototype.on = function(event, callback) {
	if ( this.events[event] == undefined ) { this.events[event] = [] }
	this.events[event].push(callback)
}
ORM.prototype.event = function(event, params) {
	if ( this.events[event] instanceof Array ) {
		for (var i = this.events[event].length - 1; i >= 0; i--) {
			var callback = this.events[event][i]
			if ( callback instanceof Function ) { callback(params) }
			this.events[event].splice(i,1)
		}
	}
}
ORM.prototype.table = function(table_name, callback) {
	var this_orm = this 
	this.table_name = table_name
	this.ready_tables[table_name] = false
	table_name = table_name
	this.db.query('CREATE TABLE IF NOT EXISTS '+mysql.escapeId(table_name)+' ( id INT AUTO_INCREMENT PRIMARY KEY )', {}, function(error, results, fields, query) {
		console.log("ORM :: "+query.sql, error ? ' :: failed' : ' :: success')
		this_orm.ready_tables[table_name] = true
		this_orm.event('ready_table_'+table_name)
		if ( callback instanceof Function ) { callback.apply(null, arguments) }
	})
	return this
}
ORM.prototype.column = function(column, type, extra, callback, table_name) {
	var this_orm = this
	if ( table_name == undefined ) { table_name = this.table_name }
	if ( !this.ready_tables[table_name] ) { this.on('ready_table_'+table_name, function(table) { this_orm.column.call(this_orm, column, type, extra, callback, table_name) }); return this; }
	this.db.query("SELECT * FROM information_schema.columns WHERE table_name = :table AND table_schema = :schema AND column_name = :column",
		{
			table: table_name,
			schema: this.db.database,
			column: column
		},
		function(error, results, fields) {
			if ( error ) { if ( callback instanceof Function ) { callback.apply(null, arguments) }; return this_orm; }
			var sql = "ALTER TABLE "+mysql.escapeId(table_name)
			sql += results.length == 0 ? " ADD " : " MODIFY ";
			sql += "COLUMN "+mysql.escapeId(column)+" "+this_orm.parseType(type)+" "+this_orm.parseExtra(extra)
			this_orm.db.query(sql, {}, function(error) {
				console.log("ORM :: "+arguments[3].sql, error?' :: failed':' :: success')
				if ( callback instanceof Function ) { callback.apply(null, arguments) }
			})
		}
	)
	return this;
}
ORM.prototype.drop = function(column_name, callback, table_name) {
	var this_orm = this
	if ( table_name == undefined ) { table_name = this.table_name }
	if ( !this.ready_tables[table_name] ) { this.on('ready_table_'+table_name, function(table) { this_orm.drop.call(this_orm, column_name, callback, table_name) }); return this; }
	if ( typeof column_name == 'undefined' ) {
		this.ready_tables[table_name] = false
		this.db.query("DROP TABLE IF EXISTS "+mysql.escapeId(table_name), {}, function(error) {
			console.log("ORM :: "+arguments[3].sql, error?' :: failed':' :: success')
			if ( callback instanceof Function ) { callback.apply(null, arguments) }
		})
	} else {
		this.db.query("ALTER TABLE "+mysql.escapeId(table_name)+" DROP COLUMN "+mysql.escapeId(column_name), {}, function(error) {
			console.log("ORM :: "+arguments[3].sql, error?' :: failed':' :: success')
			if ( callback instanceof Function ) { callback.apply(null, arguments) }
		})
	}
	return this
}
ORM.prototype.parseType = function(type) {
	var params = type.split('_')
	var length = (params.length > 1 && !isNaN(params[1]) ) ? params[1] : "";
	var type   = (params.length > 1 && isNaN(params[1]) && typeof params[1] == 'string' ) ? params[1].split(" ")[0].toUpperCase() : "";
	var digits = (params.length > 2 && !isNaN(params[2]) ) ? params[2] : 11;

	var list   = ""
	if ( params[0] == 'list' && params.length > 1 ) {
		for (var i = 1; i < params.length; i++) {
			list += "'"+params[i].split(" ")[0]+"'"
		}
	}

	switch ( params[0] ) {
		case 'varchar': return "VARCHAR("+length+")";                      break;
		case 'char'   : return "CHAR("+length+")";                         break;
		case 'text'   : return type+"TEXT";                                break;
		case 'blob'   : return type+"BLOB";                                break;
		case 'string' :
			return isNaN(length) ? "TEXT" : "VARCHAR("+length+")";
		break;

		case 'enum':
		case 'list': 
		case 'set' :
			if ( list.length > 0 ) {
				return "ENUM("+list+")";
			} else {
				return "SET";
			}
		break;

		case 'int'    : return type+"INT("+length+")";           break;
		case 'float'  : return "FLOAT("+length+","+digits+")";   break;
		case 'double' : return "DOUBLE("+length+","+digits+")";  break;
		case 'decimal': return "DECIMAL("+length+","+digits+")"; break;

		case 'date'     : return "DATE";      break;
		case 'datetime' : return "DATETIME";  break;
		case 'timestamp': return "TIMESTAMP"; break;
		case 'time'     : return "TIME";      break;
		case 'year'     : return "YEAR";      break;
	}
}
ORM.prototype.parseExtra = function(extra) {
	var string = ""
	if ( extra && extra.notnull ) { string += " NOT NULL " }
	return string.trim()
}

module.exports = ORM