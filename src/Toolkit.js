const EventEmitter = require('events')

function Deferrer() {
	this.queue = 0
	this.events = {}
}
Deferrer.prototype = new EventEmitter()
Deferrer.prototype.constructor = Deferrer
Deferrer.prototype.wait = function(callback) {
	this.queue++
	var this_deferrer = this
	return function() {
		this_deferrer.queue--
		if ( callback instanceof Function ) { callback.apply(null, arguments) }
		this_deferrer.emit('load')
		if ( this_deferrer.queue == 0 ) {
			this_deferrer.emit('done')
		}
	}
}

function parseDate(date) {
	date = new Date(date)
	return pad(date.getUTCFullYear(), 4)
		+ "/" +pad(date.getUTCMonth(), 2)
		+ "/" +pad(date.getUTCDate(), 2)
		+ " " +pad(date.getUTCHours(), 2)
		+ "." +pad(date.getUTCMinutes(), 2)
		+ "." +pad(date.getUTCSeconds(), 2)
		+ ".."+pad(date.getUTCMilliseconds(), 3)
}

function pad(value, length) {
	let len = 1
	let mag = 10
	let padding = ""
	while ( len < length ) {
		if ( value < mag ) { padding += "0" }
		mag *= 10
		len++
	}
	return padding + String(value)
}

module.exports = {
	Deferrer: Deferrer,
	parseDate: parseDate,
	pad: pad
}