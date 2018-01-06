const fs = require('fs')
const utils = require('./utils')
const url = require('url')
const client = require('./cassandra')
const winston = require('winston')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorized: true })]
})

const errors = fs.readFileSync('./error_codes/api_errors.json').toJSON();
const userCredentials = fs.readFileSync('./cassandra/user_creds.json').toJSON()
const userOptions = fs.readFileSync('./cassandra/user_options.json').toJSON()
const contentCredentials = fs.readFileSync('./cassandra/user_content_creds.json').toJSON()
const contentOptions = fs.readFileSync('./cassandra/user_content_options.json').toJSON()

try {
  client.init('user', userCredentials, userOptions)
  client.init('content', contentCredentials, contentOptions)
  logger.info('DB connections initialized successfully!')
} catch (e) {
  logger.error(e)
  process.exit(1)
}
const headers = {
  'Content-Type': 'application/json'
}

function writeError(res, errorCode, details) {
  logger.debug(errors.errorCode)
  res.writeHead(errorCode, headers)
  res.write(JSON.stringify({
    errorMessage: {
      general: errors.errorCode,
      detailed: details || ''
    }
  }))
  res.end()
}

function writeSuccess(res, result) {
  res.writeHead(200, headers)
  res.write(JSON.stringify({
    message: 'success',
    result: result || ''
  }))
  res.end()
}

process.on('uncaughtException', error => {
  logger.error(error)
  process.exit(1)
})


let body
let jsonBody

module.exports = (req, res) => {
  let urlParts = url.parse(req.url, true)
  if (req.method === 'GET') {
    let query = urlParts.query
    if (Object.keys(query).length === 0) {
      return writeError(res, 604)
    }
    if (query.uuid.length !== 36) {
      return writeError(res, 602)
    }
    switch (urlParts.pathname) {
      case '/images': {
        let useruuid = query.uuid
        client.getImages(useruuid, (err, result) => {
          if (err) {
            writeError(res, 501, err)
          } else {
            writeSuccess(res, result)
          }
        })
        break
      }
      case '/searches': {
        let imageuuid = query.uuid
        client.getSavedSearchItems(imageuuid, (err, result) => {
          if (err) {
            writeError(res, 501, err)
          } else {
            writeSuccess(res, result)
          }
        })
        break
      }
      default: {
        writeError(res, 404)
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
          case '/user': {
            if (!utils.validateEmail(jsonBody.email) && !jsonBody.password) {
              return writeError(res, 603)
            }
            client.getUser(jsonBody.email, jsonBody.password, (err, result) => {
              if (err) {
                writeError(res, 501, err)
              } else {
                if (result) {
                  utils.comparePasswords(jsonBody.password, result.password, (err, success) => {
                    if (err) {
                      writeError(res, 604, err)
                    } else if (!success) {
                      let content = {
                        id: result.id.toString(),
                        email: jsonBody.email,
                        firstname: result.firstname,
                        lastname: result.lastname
                      }
                      writeSuccess(res, content)
                    } else {
                      writeError(res, 605)
                    }
                  })
                } else {
                  writeError(res, 405)
                }
              }
            })
            break
          }
          case '/newuser': {
            if (!utils.validateEmail(jsonBody.email) || !utils.validatePassword(jsonBody.password) ||
              !utils.validateName(jsonBody.firstname) || !utils.validateName(jsonBody.lastname)) {
              return writeError(res, 504)
            }
            utils.hashAndSaltPassword(jsonBody.password, (err, hashedPassword) => {
              if (err) {
                writeError(res, 606, err)
              } else {
                client.insertUser(jsonBody.email, hashedPassword,
                  jsonBody.firstname, jsonBody.lastname, (err, result) => {
                    if (err) {
                      writeError(res, 501, err)
                    } else {
                      writeSuccess(res)
                    }
                  })
              }
            })
            break
          }
          case '/image': {
            client.insertImage(jsonBody.useruuid, jsonBody.image, (err, result) => {
              if (err) {
                writeError(res, 501, err)
              } else {
                writeSuccess(res)
              }
            })
            break
          }
          case '/search': {
            client.insertSavedSearchItem(jsonBody.imageuuid, jsonBody.olxOffer, (err, result) => {
              if (err) {
                writeError(res, 501, err)
              } else {
                writeSuccess(res)
              }
            })
            break
          }
          default: {
            writeError(res, 404)
          }
        }
      } catch (e) {
        writeError(res, 500, e)
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
                writeError(res, 501, err)
              } else {
                writeSuccess(res)
              }
            })
            break
          }
          case '/image': {
            client.deleteImage(jsonBody.useruuid, jsonBody.imageuuid, (err, result) => {
              if (err) {
                writeError(res, 501, err)
              } else {
                writeSuccess(res)
              }
            })
            break
          }
          case '/search': {
            client.deleteSavedSearchItem(jsonBody.imageuuid, jsonBody.offeruuid, (err, result) => {
              if (err) {
                writeError(res, 501, err)
              } else {
                client.deleteImage(jsonBody.useruuid, jsonBody.imageuuid, (err, result) => {
                  if (err) {
                    writeError(res, 501, err)
                  } else {
                    writeSuccess(res)
                  }
                })
              }
            })
            break
          }
          default: {
            writeError(res, 404)
          }
        }
      } catch (e) {
        writeError(res, 500, e)
      }
    })
  } else {
    writeError(res, 404)
  }
}