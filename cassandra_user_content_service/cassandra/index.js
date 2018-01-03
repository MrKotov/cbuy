const cassandra = require('cassandra-driver')
const uuid = require('cassandra-driver').types.Uuid
const fs = require('fs')
let client

const errorMessages = JSON.parse(fs.readFileSync('./cassandra/error_messages.json'))

module.exports = {
  init: (credentials, options) => {
    try {
      const auth = new cassandra.auth.PlainTextAuthProvider(credentials.username, credentials.password)
      options.authProvider = auth
      client = new cassandra.Client(options)
    } catch (e) {
      throw new Error('Error while initializing cassandra client: %s', e)
    }
  },
  insertImage: (image, useruuid, callback) => insertImage(image, useruuid, callback),
  getImages: (userUID, callback) => getImages(userUID, callback),
  deleteImage: (useruuid, imageId, callback) => deleteImage(useruuid, imageId, callback),
  insertSavedSearchItem: (imageuuid, olxOffer, callback) => insertSearchItem(imageuuid, olxOffer, callback),
  getSavedSearchItems: (imageuuid, callback) => getSavedSearchItems(imageuuid, callback),
  deleteSavedSearchItem: (imageuuid, offeruuid, callback) => deleteSavedSearchItem(imageuuid, offeruuid, callback),
  close: () => {
    if (client) {
      client.shutdown()
    } else {
      throw new Error('The client is not initialized!')
    }
  }

}

function insertImage (image, useruuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  } else if (!image || !image.content || !image.tags || !useruuid) {
    return callback(errorMessages['504'])
  }
  const query = 'INSERT INTO images(id, useruuid, content, tags) VALUES(?, ?, ?, ?);'

  client.execute(query, [uuid.random(), useruuid, image.content, image.tags], { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function getImages (useruuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  } else if (!useruuid) {
    return callback(errorMessages['504'])
  }
  const query = 'SELECT id, content, tags FROM images WHERE useruuid = ?;'
  client.execute(query, [useruuid], { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      const imagesArray = []
      for (let row of res.rows) {
        imagesArray.push({ id: row.id, content: Buffer.from(row.content).toString('base64'), tags: row.tags })
      }
      callback(null, imagesArray)
    }
  })
}

function deleteImage (useruuid, imageuuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  } else if (!useruuid || imageuuid) {
    return callback(errorMessages['504'])
  }
  const queries = [
    {
      query: 'DELETE FROM saved_searches WHERE imageuuid = ? IF EXISTS;',
      params: [imageuuid]
    },
    {
      query: 'DELETE FROM images WHERE useruuid = ? and id = ? IF EXISTS;',
      params: [useruuid, imageuuid]
    }
  ]
  client.batch(queries, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function insertSearchItem (imageuuid, olxOffer, callback) {
  if (!client) {
    return callback(errorMessages['504'])
  } else if (!olxOffer || olxOffer.href) {
    return callback(errorMessages['504'])
  }
  const query = 'INSERT INTO saved_searches(id, imageuuid, olxSrc, olxAlt, olxHref, olxPrice) VALUES(?, ?, ?, ?, ?, ?);'
  client.execute(query,
    [uuid.random(), imageuuid, olxOffer.src, olxOffer.alt, olxOffer.href, olxOffer.price], { prepare: true },
    (err, res) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
}

function getSavedSearchItems (imageuuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  }
  const query = 'SELECT id, olxSrc, olxAlt, olxHref, olxPrice FROM saved_searches WHERE imageuuid = ?;'
  client.execute(query, [imageuuid], { prepare: true },
    (err, res) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
}

function deleteSavedSearchItem (imageuuid, offeruuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  } else if (!offeruuid) {
    return callback(errorMessages['504'])
  }
  const query = 'DELETE FROM saved_searches WHERE imageuuid = ? and id = ?;'
  client.execute(query, [imageuuid, offeruuid], { prepare: true },
    (err, res) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
}
