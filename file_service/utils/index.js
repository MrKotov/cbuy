const fs = require('fs')
const mime = require('mime')

const allowedMimeTypes = Object.freeze(['image/jpg', 'image/jpeg', 'image/png'])

module.exports = {
  validateMimeType: (file, callback) => validateMimeType(file, callback),
  getImageNameFromPath: (path) => getImageNameFromPath(path),
  renameFile: (path, name) => renameFile(path, name)
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

function renameFile (path, name) {
  let pathTokens = path.split('/')
  pathTokens[pathTokens.length - 1] = name
  let newPath = ''
  for (let token of pathTokens) {
    newPath += '/' + token
  }
  fs.renameSync(path, newPath)
  return newPath
}
