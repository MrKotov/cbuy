const GoogleCloudStorage = require('@google-cloud/storage')

const storage = GoogleCloudStorage({
  projectId: 'vision-project-184905',
  keyFilename: './creds.json'
})
module.exports = {
  createUserBucket: (useruuid, callback) => createUserBucket(useruuid, callback),
  deleteUserBucket: (useruuid, callback) => deleteUserBucket(useruuid, callback),
  uploadImage: (useruuid, image, callback) => uploadImage(useruuid, image, callback),
  deleteImage: (useruuid, imageName, callback) => deleteImage(useruuid, imageName, callback)
}

function createUserBucket (useruuid, callback) {
  storage.createBucket(useruuid, (error, result) => {
    if (error) {
      callback(error)
    } else {
      callback(null)
    }
  })
}

function deleteUserBucket (useruuid, callback) {
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
  const imageNameTokens = image.split('/')
  const imageName = imageNameTokens[imageNameTokens.length - 1]
  const userBucket = storage.bucket(useruuid)
  userBucket.file(imageName).exists((error, exists) => {
    if (error) {
      callback(error)
    } else if (!exists) {
      userBucket.upload(image, {public: true}, (error, result) => {
        if (error) {
          callback(error)
        } else {
          callback(null, {imageUrl: `https://storage.googleapis.com/${useruuid}/${imageName}`})
        }
      })
    } else {
      callback(null, {imageUrl: `https://storage.googleapis.com/${useruuid}/${imageName}`})
    }
  })
}

function deleteImage (useruuid, imageName, callback) {
  const userBucket = storage.bucket(useruuid)
  userBucket.file(imageName).delete((error, result) => {
    if (error) {
      callback(error)
    } else {
      callback(null)
    }
  })
}
