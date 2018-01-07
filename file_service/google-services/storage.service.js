const GoogleCloudStorage = require('@google-cloud/storage')
const utils = require('../utils')

let storage
const notInitializedMessage = 'Google Clooud Storage not initialized.'

module.exports = {
  init: (projectId, keyFilename) => {
    try {
      storage = GoogleCloudStorage({
        projectId: projectId,
        keyFilename: keyFilename
      })
    } catch (e) {
      throw new Error('Exception during initializitaion: ' + e)
    }
  },
  createUserBucket: (useruuid, callback) => createUserBucket(useruuid, callback),
  deleteUserBucket: (useruuid, callback) => deleteUserBucket(useruuid, callback),
  uploadImage: (useruuid, image, callback) => uploadImage(useruuid, image, callback),
  deleteImage: (useruuid, imageName, callback) => deleteImage(useruuid, imageName, callback)
}

function createUserBucket (useruuid, callback) {
  if (!storageIsInitialized()) {
    return callback(notInitializedMessage)
  }
  storage.createBucket(useruuid, (error, result) => {
    if (error) {
      callback(error)
    } else {
      callback(null)
    }
  })
}

function deleteUserBucket (useruuid, callback) {
  if (!storageIsInitialized()) {
    return callback(notInitializedMessage)
  }
  storage.bucket(useruuid).deleteFiles((error, result) => {
    if (error) {
      callback(error)
    } else {
      storage.bucket(useruuid).delete((error, result) => {
        if (error) {
          callback(error)
        } else {
          callback(null)
        }
      })
    }
  })
}

function uploadImage (useruuid, image, callback) {
  if (!storageIsInitialized()) {
    return callback(notInitializedMessage)
  }
  const imageName = utils.getImageNameFromPath(image)
  const userBucket = storage.bucket(useruuid)
  userBucket.file(imageName).exists((error, exists) => {
    if (error) {
      callback(error)
    } else if (!exists) {
      userBucket.upload(image, { public: true }, (error, result) => {
        if (error) {
          callback(error)
        } else {
          callback(null, { imageUrl: `https://storage.googleapis.com/${useruuid}/${imageName}` })
        }
      })
    } else {
      callback(null)
    }
  })
}

function deleteImage (useruuid, imageName, callback) {
  if (!storageIsInitialized()) {
    return callback(notInitializedMessage)
  }
  const userBucket = storage.bucket(useruuid)
  userBucket.file(imageName).delete((error, result) => {
    if (error) {
      callback(error)
    } else {
      callback(null)
    }
  })
}

function storageIsInitialized () {
  if (!storage) {
    return false
  } else {
    return true
  }
}
