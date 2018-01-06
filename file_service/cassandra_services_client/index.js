const http = require('http')
const fs = require('fs')
let configuration

module.exports = {
  init: (configurationFile) => {
    try {
      configuration = fs.readFileSync(configurationFile).toJSON()
    } catch (e) {
      throw new Error(e)
    }
  },
  makeRequest: (operation, image, useruuid, callback) => makeRequest(operation, image, useruuid, callback)
}

function makeRequest (operation, image, useruuid, callback) {
  if (!configuration) {
    let errorMessage = 'Configuration is not initialized.'
    return callback(errorMessage)
  }

  let options
  const requestBody = {
    useruuid: useruuid
  }

  switch (operation) {
    case 'insert': {
      options = configuration
      options.method = 'POST'
      requestBody.image = image
      break
    }
    case 'delete': {
      options = configuration
      options.method = 'DELETE'
      requestBody.imageId = image.imageId
      break
    }
    default: {
      let invalidOperation = 'Invalid operation: ' + operation
      return callback(invalidOperation)
    }
  }

  const postRequest = http.request(options, (resp) => {
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
  postRequest.write(JSON.stringify(requestBody))
  postRequest.end()
}
