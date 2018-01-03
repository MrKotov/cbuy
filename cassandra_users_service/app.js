const fs = require('fs')
const http = require('http')
const url = require('url')
const client = require('./cassandra')
const winston = require('winston')
const utils = require('./shared/utils')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorized: true })]
})
const credentials = JSON.parse(fs.readFileSync('./cassandra/creds.json').toString())
const options = JSON.parse(fs.readFileSync('./cassandra/cassandra_options.json').toString())

client.init(credentials, options)

const headers = {
  'Content-Type': 'application/json'
}

let urlParts
let body
let jsonBody

http.createServer((req, res) => {
  urlParts = url.parse(req.url, true)

  if (req.method === 'POST') {
    body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        jsonBody = JSON.parse(body)

        switch (urlParts.pathname) {
          case '/user': {
            if (!utils.validateEmail(jsonBody.email) && !jsonBody.password) {
              res.writeHead(505, headers)
              res.write(JSON.stringify({
                message: 'Invalid user information!'
              }))
              res.end()
              return logger.error('Invalid user information!')
            }

            client.getUser(jsonBody.email, jsonBody.password, (err, result) => {
              if (err) {
                res.writeHead(505, headers)
                res.write(JSON.stringify({
                  message: err
                }))
                res.end()
                return logger.error(err)
              } else {
                if (result) {
                  utils.comparePasswords(jsonBody.password, result.password, (err, success) => {
                    if (err) {
                      res.writeHead(500, headers)
                      res.write(JSON.stringify({
                        message: 'Internal server error!'
                      }))
                      res.end()
                      return logger.debug(err)
                    } else if (!success) {
                      let content = {
                        id: result.id.toString(),
                        email: jsonBody.email,
                        firstname: result.firstname,
                        lastname: result.lastname
                      }
                      res.writeHead(200, headers)
                      res.write(JSON.stringify({
                        message: 'success',
                        content: content
                      }))
                      res.end()
                      return logger.debug('Successfully authenticated user: ' + result.id)
                    } else {
                      res.writeHead(504, headers)
                      res.write(JSON.stringify({
                        message: 'Wrong password!'
                      }))
                      res.end()
                      return logger.debug(err)
                    }
                  })
                } else {
                  res.writeHead(204, headers)
                  res.write(JSON.stringify({
                    message: 'No user was found.'
                  }))
                  res.end()
                  return logger.debug('No user was found for email: ' + jsonBody.email)
                }
              }
            })
            break
          }
          case '/newuser': {
            if (!utils.validateEmail(jsonBody.email) || !utils.validatePassword(jsonBody.password) ||
              !utils.validateName(jsonBody.firstname) || !utils.validateName(jsonBody.lastname)) {
              res.writeHead(505, headers)
              res.write(JSON.stringify({
                message: 'Invalid user information!'
              }))
              res.end()
              return logger.error('Invalid user information!')
            }
            utils.hashAndSaltPassword(jsonBody.password, (err, hashedPassword) => {
              if (err) {
                res.writeHead(500, headers)
                res.write(JSON.stringify({
                  message: 'Password hashing error!'
                }))
                res.end()
                return logger.error('Password hashing error!')
              } else {
                client.insertUser(jsonBody.email, hashedPassword,
                  jsonBody.firstname, jsonBody.lastname, (err, result) => {
                    if (err) {
                      res.writeHead(505, headers)
                      res.write(JSON.stringify({
                        message: err
                      }))
                      res.end()
                      return logger.error(err)
                    } else {
                      res.writeHead(200, headers)
                      res.write(JSON.stringify({
                        message: 'success'
                      }))
                      res.end()
                      return logger.debug('Successfully create user: ' + jsonBody.email)
                    }
                  })
              }
            })
            break
          }
          default: {
            res.writeHead(404, headers)
            res.write(JSON.stringify({
              message: 'Path not found!'
            }))
            res.end()
            return logger.debug('Tried to reach non-existing path: ' + url.pathname)
          }
        }
      } catch (e) {
        res.writeHead(500, headers)
        res.write(JSON.stringify({
          message: 'Invalid JSON body!'
        }))
        res.end()
        return logger.error('Invalid json: ' + body)
      }
    })
  } else if (req.method === 'DELETE') {
    body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        jsonBody = JSON.parse(body)
        switch (urlParts.pathname) {
          case '/user': {
            client.deleteUser(jsonBody.useruuid, (err, result) => {
              if (err) {
                res.writeHead(505, headers)
                res.write(JSON.stringify({
                  message: err
                }))
                res.end()
                return logger.error(err)
              } else {
                res.writeHead(200, headers)
                res.write(JSON.stringify({
                  message: 'success'
                }))
                res.end()
                return logger.debug('Successfully deleted image with uuid: !' + jsonBody.imageuuid)
              }
            })
            break
          }
          default: {
            res.writeHead(404, headers)
            res.write('Not found.')
            res.end()
          }
        }
      } catch (e) {
        res.writeHead(500, headers)
        res.write(JSON.stringify({
          message: 'Invalid JSON body!'
        }))
        res.end()
        return logger.error('Invalid json: ' + body)
      }
    })
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      message: 'Path not found!'
    }))
    res.end()
    return logger.debug('Tried to reach non-existing path: ' + url.pathname)
  }
}).listen(8083)

process.on('uncaughtException', error => {
  logger.error(error)
  process.exit(1)
})
