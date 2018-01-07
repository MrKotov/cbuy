const http = require('http')
const fs = require('fs')
let configuration

module.exports = {
  init: (configurationFile) => {
    try {
      configuration = JSON.parse(fs.readFileSync(configurationFile).toString())
    } catch (e) {
      throw new Error(e)
    }
  },
  makeRequest: (operation, useruuid, image, callback) => makeRequest(operation, useruuid, image, callback)
}

function makeRequest (operation, useruuid, image, callback) {
  if (!configuration) {
    let errorMessage = 'Configuration is not initialized.'
    return callback(errorMessage)
  }

  let options = configuration
  const requestBody = {
    useruuid: useruuid
  }

  switch (operation) {
    case 'insert': {
      options.method = 'POST'
      requestBody.image = image
      options.headers = {}
      break
    }
    case 'delete': {
      options.method = 'DELETE'
      requestBody.imageuuid = image.imageuuid
      options.headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
      }
      break
    }
    default: {
      let invalidOperation = 'Invalid operation: ' + operation
      return callback(invalidOperation)
    }
  }

  const request = http.request(options, (resp) => {
    let buffer = []
    resp.on('data', (data) => {
      buffer.push(data.toString())
    })
    resp.on('end', () => {
      try {
        callback(null, JSON.parse(buffer.join('')))
      } catch (e) {
        callback(e)
      }
    })
    resp.on('error', (err) => {
      callback(err)
    })
  })
  request.on('error', (err) => {
    callback(err)
  })
  request.write(JSON.stringify(requestBody))
  request.end()
}
