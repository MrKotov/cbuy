const http = require('http')
const server = http.createServer(require('./handler'))
const port = parseInt(process.argv.slice(2))
server.listen(8082)
