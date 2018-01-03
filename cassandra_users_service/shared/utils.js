'use strict'
const validator = require('validator')
const bcrypt = require('bcrypt')

const saltRounds = 10

module.exports = {
  validateEmail: (inputEmail) => validateEmail(inputEmail),
  validatePassword: (password) => validatePassword(password),
  validateName: (name) => validateName(name),
  hashAndSaltPassword: (password, callback) => hashAndSaltPassword(password, callback),
  comparePasswords: (password, savedHash, callback) => comparePasswords(password, savedHash, callback)
}

function validateEmail (inputEmail) {
  if (!validator.isEmail(inputEmail)) {
    return false
  } else {
    return true
  }
}

function validatePassword (password) {
  if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/)) {
    return false
  } else {
    return true
  }
}

function validateName (name) {
  if (!name.match(/^[a-z ,.'-]+$/i)) {
    return false
  } else {
    return true
  }
}

function hashAndSaltPassword (password, callback) {
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      callback(err)
    } else {
      callback(null, hash)
    }
  })
}

function comparePasswords (password, savedHash, callback) {
  bcrypt.compare(password, savedHash, (err, same) => {
    if (err) {
      callback(err)
    } else {
      if (same) {
        callback(null)
      } else {
        callback(null, true)
      }
    }
  })
}
