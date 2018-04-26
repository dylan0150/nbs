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
	function pad(i) { return i < 10 ? "0"+i : ""+i;}
	function padd(i) { return i < 10 ? "00"+i : i < 100 ? "0"+i : ""+i;}
	return pad(date.getUTCFullYear())
		+ "/" +pad(date.getUTCMonth())
		+ "/" +pad(date.getUTCDate())
		+ " " +pad(date.getUTCHours())
		+ "." +pad(date.getUTCMinutes())
		+ "." +pad(date.getUTCSeconds())
		+ ".."+padd(date.getUTCMilliseconds())
}

module.exports = {
	Deferrer: Deferrer,
	parseDate: parseDate
}