const mime = require('mime')
const allowedMimeTypes = Object.freeze(['image/jpg', 'image/jpeg', 'image/png'])

module.exports = {
  validateMimeType: (file, callback) => validateMimeType(file, callback),
  getImageNameFromPath: (path) => getImageNameFromPath(path)
}
function validateMimeType (file, callback) {
  const fileType = mime.getType(file)
  const result = allowedMimeTypes.filter(allowedFileType => {
    return fileType === allowedFileType
  })
  result[0] ? callback(null, result[0]) : callback(fileType)
}

function getImageNameFromPath (path) {
  if (!path) {
    let pathTokens = path.split('/')
    return pathTokens[pathTokens.length - 1]
  } else {
    return ''
  }
}
