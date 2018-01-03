const fs = require('fs')
const http = require('http')
const url = require('url')
const client = require('./cassandra')
const winston = require('winston')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorized: true })]
})
const credentials = JSON.parse(fs.readFileSync('./cassandra/creds.json').toString())
const options = JSON.parse(fs.readFileSync('./cassandra/cassandra_options.json').toString())

try {
  client.init(credentials, options)
  logger.info('DB connection initialized successfully!')
} catch (e) {
  logger.error(e)
  process.exit(1)
}
const headers = {
  'Content-Type': 'application/json'
}

let urlParts
let query
let body
let jsonBody

http.createServer((req, res) => {
  urlParts = url.parse(req.url, true)
  if (req.method === 'GET') {
    query = urlParts.query
    if (Object.keys(query).length === 0) {
      res.writeHead(505, headers)
      res.write(JSON.stringify({
        message: 'GET method query cannot be empty!'
      }))
      res.end()
      return logger.error('GET method query cannot be empty!')
    }
    if (query.uuid.length !== 36) {
      res.writeHead(505, headers)
      res.write(JSON.stringify({
        message: 'Invalid uuid length!'
      }))
      res.end()
      return logger.error('Invalid uuid length!')
    }

    switch (urlParts.pathname) {
      case '/images': {
        let useruuid = query.uuid
        client.getImages(useruuid, (err, result) => {
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
              message: 'success',
              content: result
            }))
            res.end()
            return logger.debug('Successfully fetched images for user: ' + useruuid)
          }
        })
        break
      }
      case '/searches': {
        let imageuuid = query.uuid
        client.getSavedSearchItems(imageuuid, (err, result) => {
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
              message: 'success',
              content: result
            }))
            res.end()
            return logger.debug('Successfully saved searches for user: !' + imageuuid)
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
  } else if (req.method === 'POST') {
    body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        jsonBody = JSON.parse(body)
        switch (urlParts.pathname) {
          case '/image': {
            client.insertImage(jsonBody.image, jsonBody.useruuid, (err, result) => {
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
                return logger.debug('Successfully added image for user: !' + jsonBody.useruuid)
              }
            })
            break
          }
          case '/search': {
            client.insertSavedSearchItem(jsonBody.imageuuid, jsonBody.olxOffer, (err, result) => {
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
                return logger.debug('Successfully saved olxOffer for image: !' + jsonBody.imageuuid)
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
          case 'image': {
            client.deleteImage(jsonBody.useruuid, jsonBody.imageuuid, (err, result) => {
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
          case 'search': {
            client.deleteSavedSearchItem(jsonBody.imageuuid, jsonBody.offeruuid, (err, result) => {
              if (err) {
                res.writeHead(505, headers)
                res.write(JSON.stringify({
                  message: err
                }))
                res.end()
                return logger.error(err)
              }

              client.deleteImage(jsonBody.useruuid, jsonBody.imageuuid, (err, result) => {
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
                  return logger.debug('Successfully deleted saved OLX offer with uuid: ' + jsonBody.offeruuid)
                }
              })
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
}).listen(8084)

process.on('uncaughtException', error => {
  logger.error(error)
  process.exit(1)
})
