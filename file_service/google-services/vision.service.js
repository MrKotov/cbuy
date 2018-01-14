const https = require('https')

module.exports = {
  getImageTags: function getImageTags (googleApiKey, imageUri, callback) {
    processImage(googleApiKey, imageUri, (err, result) => {
      if (err) {
        console.log(err)
        callback(err)
      } else {
        let tagsArray = []
        for (let anotation in result.responses[0].labelAnnotations) {
          tagsArray.push(result.responses[0].labelAnnotations[anotation].description)
        }
        callback(null, tagsArray)
      }
    })
  }
}

function processImage (apiKey, imageUri, callback) {
  const requestBody = {
    requests: [
      {
        image: {
          source: {
            imageUri: imageUri
          }
        },
        features: [
          {
            type: 'LABEL_DETECTION',
            maxResults: 3
          }
        ]
      }
    ]
  }

  const options = {
    host: 'vision.googleapis.com',
    port: 443,
    path: '/v1/images:annotate?key=' + apiKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const postRequest = https.request(options, (resp) => {
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
      callback(err, err.message)
    })
  })
  postRequest.write(JSON.stringify(requestBody))
  postRequest.on('error',(error) => {
    callback(error)
  })
  postRequest.end()
}
