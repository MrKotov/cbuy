'use strict'

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
  getUser: (email, password, callback) => getUser(email, password, callback),
  insertUser: (email, password, firstname, lastname, callback) => insertUser(email, password, firstname, lastname, callback),
  deleteUser: (useruuid, callback) => deleteUser(useruuid, callback),
  close: () => {
    if (client) {
      client.shutdown()
    } else {
      throw new Error('The client is not initialized!')
    }
  }

}

function getUser (email, password, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  }
  const query = 'SELECT id, email, password, firstname, lastname FROM app_users WHERE email = ? allow filtering;'
  const params = [email]
  client.execute(query, params, { prepare: true }, (err, res) => {
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
  if (!client) {
    return callback(errorMessages['502'])
  } else if (!email || !password || !firstname || !lastname) {
    return callback(errorMessages['504'])
  }
  const query = 'INSERT INTO app_users(id, email, password, firstname, lastname) VALUES(?, ?, ?, ?, ?);'
  const params = [uuid.random(), email, password, firstname, lastname]
  client.execute(query, params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}

function deleteUser (useruuid, callback) {
  if (!client) {
    return callback(errorMessages['502'])
  }
  const query = 'DELETE FROM app_users WHERE id = ?;'
  const params = [useruuid]
  client.execute(query, params, { prepare: true }, (err, res) => {
    if (err) {
      callback(err)
    } else {
      callback(null)
    }
  })
}
