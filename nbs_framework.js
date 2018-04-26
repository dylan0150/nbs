const Server  = require('./src/Server')
const Toolkit = require('./src/Toolkit')
const Handler = require('./src/Handler')
const ORM     = require('./src/ORM')
const Auth    = require('./src/Auth')
const DB      = require('./src/DB')

function nbs() {

}
nbs.Server  = Server
nbs.Toolkit = Toolkit
nbs.Handler = Handler
nbs.ORM     = ORM
nbs.Auth    = Auth
nbs.DB      = DB

module.exports = nbs