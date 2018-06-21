## A node framework built on top of express


### Aims

1. To remove a lot of express boilerplate through standardisation (authentication, routing)
2. To provide an easy SQL interface ie ( db.query(SQL, params) )
3. To remain fast and simple


### Install

`yarn add nbs_framework`
`npm install nbs_framework --save`


### Example

#### /index.js
```JavaScript
const nbs = require('nbs_framework')

const config = {
    host: {
        port: 8080
    },
    webroot: "www",
    response_headers: {
        "Access-Control-Allow-Origin": "*"
    },
    auth: {
        cookie_name: "auth",
        session_expires: 60*60,
        cookie_options: {
            maxAge: 60*60
        },
        keys: {
            "aes": "mySecretKey"
        },
        public_urls: ['/api/login']
    }
}

const server = new nbs.Server(config)
    .initAuth()
    .route('post', '/api/login')
```

#### /api/login.js
```JavaScript
module.exports = {
    POST: function(params) {
        if ( params.username !== "mySecretName" || params.password != "mySecretPassword" ) {
            return this.respond({ok: false}, 403)
        }

        let session_token = this.server.auth.createToken({ username: params.username, loggedin: true }, "aes")

        this.cookie(this.server.config.auth.cookie_name, session_token)

        this.respond({ok: true})
    }
}
```