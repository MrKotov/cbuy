const http = require('http')
const server = http.createServer(require('./handler'))
const port = process.argv.slice(2)

server.listen(port)
