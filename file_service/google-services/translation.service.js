const https = require('https')

module.exports = {
  translateTags: function translateTags (googleApiKey, query, targetLanguage, callback) {
    translateArray(googleApiKey, query, targetLanguage, (err, result) => {
      if (err) {
        callback(err)
      } else {
        let translatedTagsArray = []
        for (let translation in result.data.translations) {
          translatedTagsArray.push(result.data.translations[translation].translatedText)
        }
        callback(null, translatedTagsArray)
      }
    })
  }
}

function translateArray (apiKey, query, targetLanguage, callback) {
  if (!Array.isArray(query)) {
    let error = 'Query must be an array of values.'
    return callback(error)
  }

  let requestBody = {
    q: []
  }
  query.forEach(element => {
    requestBody.q.push(element)
  })
  requestBody.target = targetLanguage

  const options = {
    host: 'translation.googleapis.com',
    port: 443,
    path: '/language/translate/v2?key=' + apiKey,
    method: 'POST',
    headers: {
      'Content-Type': 'application/javascript'
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
  postRequest.end()
}
