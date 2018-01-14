const cassandra = require('cassandra-driver')
const uuid = require('cassandra-driver').types.Uuid
const fs = require('fs')
let userClient
let contentClient

const errorMessages = JSON.parse(fs.readFileSync('./cassandra/client_errors.json').toString())

module.exports = {
  init: (clientType, credentials, options) => {
    switch (clientType) {
      case 'user': {
        userClient = init(credentials, options)
        break
      }
      case 'content': {
        contentClient = init(credentials, options)
        break
      }
      default: {
        throw new Error(errorMessages['503'])
      }
    }
  },
  getUser: (email, password, callback) => getUser(email, password, callback),
  insertUser: (email, password, firstname, lastname, callback) => insertUser(email, password, firstname, lastname, callback),
  deleteUser: (useruuid, callback) => deleteUser(useruuid, callback),
  insertImage: (useruuid, image, callback) => insertImage(useruuid, image, callback),
  getImages: (useruuid, callback) => getImages(useruuid, callback),
  getImageById: (useruuid, imageuuid, callback) => getImageById(useruuid, imageuuid,callback),
  deleteImage: (useruuid, imageuuid, callback) => deleteImage(useruuid, imageuuid, callback),
  insertSavedSearchItem: (imageuuid, olxOffer, callback) => insertSearchItem(imageuuid, olxOffer, callback),
  getSavedSearchItems: (imageuuid, callback) => getSavedSearchItems(imageuuid, callback),
  deleteSavedSearchItem: (imageuuid, offeruuid, callback) => deleteSavedSearchItem(imageuuid, offeruuid, callback),
  close: (client) => close(client)
}

function init (credentials, options) {
  let client
  try {
    if (client) {
      throw new Error(errorMessages['504'])
    } else {
      const auth = new cassandra.auth.PlainTextAuthProvider(credentials.username, credentials.password)
      options.authProvider = auth
      return new cassandra.Client(options)
    }
  } catch (e) {
    throw new Error('Error while initializing cassandra client: %s', e)
  }
}

function close (client) {
  if (client) {
    client.shutdown()
  } else {
    throw new Error(errorMessages['501'])
  }
}

function getUser (email, password, callback) {
  if (!userClient) {
    return callback(errorMessages['502'])
  }
  const query = 'SELECT id, email, password, firstname, lastname FROM app_users WHERE email = ? ALLOW FILTERING;'
  const params = [email]
  userClient.execute(query, params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      if (res.rows.length === 1) {
        callback(null, {
          id: res.rows[0].id,
          email: res.rows[0].email,
          password: res.rows[0].password,
          firstname: res.rows[0].firstname,
          lastname: res.rows[0].lastname
        })
      } else {
        callback(null)
      }
    }
  })
}

function insertUser (email, password, firstname, lastname, callback) {
  if (!userClient) {
    return callback(errorMessages['502'])
  } else if (!email || !password || !firstname || !lastname) {
    return callback(errorMessages['503'])
  }
  const query = 'INSERT INTO app_users(id, email, password, firstname, lastname) VALUES(?, ?, ?, ?, ?);'
  const params = [uuid.random(), email, password, firstname, lastname]
  userClient.execute(query, params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function deleteUser (useruuid, callback) {
  if (!userClient) {
    return callback(errorMessages['502'])
  }
  const query = 'DELETE FROM app_users WHERE id = ?;'
  const params = [useruuid]
  userClient.execute(query, params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function insertImage (useruuid, image, callback) {
  if (!contentClient) {
    return callback(errorMessages['502'])
  } else if (!image || !image.src || !image.name || !image.tags || !useruuid) {
    return callback(errorMessages['503'])
  }
  const query = 'INSERT INTO images(id, useruuid, name, src, tags) VALUES(?, ?, ?, ?, ?);'

  contentClient.execute(query, [uuid.random(), useruuid, image.name, image.src, image.tags], { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function getImages (useruuid, callback) {
  if (!contentClient) {
    return callback(errorMessages['502'])
  } else if (!useruuid) {
    return callback(errorMessages['503'])
  }
  const query = 'SELECT id, src, name, tags FROM images WHERE useruuid = ?;'
  contentClient.execute(query, [useruuid], { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      const imagesArray = []
      for (let row of res.rows) {
        imagesArray.push({ id: row.id, src: row.src, name: row.name, tags: row.tags })
      }
      callback(null, imagesArray)
    }
  })
}

function getImageById (useruuid, imageuuid, callback) {
  if (!contentClient) {
    return callback(errorMessages['502'])
  } else if (!useruuid) {
    return callback(errorMessages['503'])
  }
  const query = 'SELECT id, src, name, tags FROM images WHERE useruuid = ? AND ID = ? ALLOW FILTERING;'
  contentClient.execute(query, [useruuid, imageuuid], { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      const image = { 
        id: res.rows[0].id, 
        src: res.rows[0].src, 
        name: res.rows[0].name, 
        tags: res.rows[0].tags }
      callback(null, image)
    }
  })
}

function deleteImage (useruuid, imageuuid, callback) {
  if (!contentClient) {
    return callback(errorMessages['502'])
  } else if (!useruuid || !imageuuid) {
    return callback(errorMessages['503'])
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
  contentClient.execute(queries[0].query, queries[0].params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      contentClient.execute(queries[1].query, queries[1].params, { prepare: true }, (err, res) => {
        if (err) {
          callback(err)
        } else {
          callback(null)
        }
      })
    }
  })
}

function insertSearchItem (imageuuid, olxOffer, callback) {
  if (!contentClient) {
    return callback(errorMessages['503'])
  } else if (!olxOffer || olxOffer.href) {
    return callback(errorMessages['503'])
  }
  const query = 'INSERT INTO saved_searches(id, imageuuid, olxSrc, olxAlt, olxHref, olxPrice) VALUES(?, ?, ?, ?, ?, ?);'
  contentClient.execute(query,
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
  if (!contentClient) {
    return callback(errorMessages['502'])
  }
  const query = 'SELECT id, olxSrc, olxAlt, olxHref, olxPrice FROM saved_searches WHERE imageuuid = ?;'
  contentClient.execute(query, [imageuuid], { prepare: true },
    (err, res) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
}

function deleteSavedSearchItem (imageuuid, offeruuid, callback) {
  if (!contentClient) {
    return callback(errorMessages['502'])
  } else if (!offeruuid) {
    return callback(errorMessages['503'])
  }
  const query = 'DELETE FROM saved_searches WHERE imageuuid = ? and id = ?;'
  contentClient.execute(query, [imageuuid, offeruuid], { prepare: true },
    (err, res) => {
      if (err) {
        callback(err)
      } else {
        callback(null)
      }
    })
}
