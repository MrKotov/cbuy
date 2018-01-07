'use strict'
const fs = require('fs')
const formidable = require('formidable')
const utils = require('./utils')
const googleServices = require('./google-services')

const projectId = 'vision-project-184905'
const keyFilename = './credentials/creds.json'
const apiKey = 'AIzaSyCZgTInlGJtETngRskWXCnol_SioozJUfA'

const cassandraServiceClient = require('./cassandra_services_client')
cassandraServiceClient.init('./configs/cassandra.config.json')

const visionService = googleServices.visionService
const translationService = googleServices.translationService
const storageService = googleServices.storageService
storageService.init(projectId, keyFilename)

const winston = require('winston')

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorized: true })]
})

const errors = JSON.parse(fs.readFileSync('./error_codes/api_errors.json').toString())

// Set max size to 2 MB
const maxImageSize = 2 * 1024 * 1024
const translateTo = 'bg'
const headers = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Methods': '',
  'Content-Type': 'application/json'
}

function writeError (res, errorCode, details) {
  logger.debug(errors.errorCode)
  res.writeHead(errorCode, headers)
  res.write(JSON.stringify({
    errorMessage: {
      general: errors[errorCode + ''],
      detailed: details || ''
    }
  }))
  res.end()
}

function writeSuccess (res, result) {
  res.writeHead(200, headers)
  res.write(JSON.stringify({
    message: 'success',
    result: result || ''
  }))
  res.end()
}

process.on('uncaughtException', error => {
  logger.error(error)
  process.exit(1)
})

module.exports = (req, res) => {
  if (req.method === 'POST' && req.url === '/file') {
    if (isNaN(parseInt(req.headers['content-length'])) || parseInt(req.headers['content-length']) > maxImageSize) {
      writeError(res, 501)
    } else {
      let form = new formidable.IncomingForm()
      form.multiples = false
      form.type = 'multipart'
      // form.uploadDir = './tmp'
      form.keepExtensions = true

      form.parse(req, function (err, fields, files) {
        if (err) {
          writeError(res, 505, err)
        } else {
          if (!files.fileInput || !fields.useruuid) {
            return writeError(res, 506)
          }
          utils.validateMimeType(files.fileInput.path, (err, success) => {
            let useruuid = fields.useruuid
            let newPath = utils.renameFile(files.fileInput.path, files.fileInput.name)
            if (err) {
              writeError(res, 504, err)
            } else {
              storageService.uploadImage(useruuid, newPath, (err, result) => {
                const imageName = files.fileInput.name

                if (err) {
                  writeError(res, 603, err)
                } else {
                  if (!result) {
                    return writeError(res, 605)
                  }
                  const imageSrc = result.imageUrl
                  visionService(apiKey, imageSrc, (err, tags) => {
                    if (err) {
                      writeError(res, 601, err)
                    } else {
                      if (tags.length !== 0) {
                        translationService(apiKey, tags, translateTo, (err, translatedTags) => {
                          if (err) {
                            writeError(res, 602, err)
                          } else {
                            for (let tag of translatedTags) {
                              tags.push(tag)
                            }
                          }
                          const image = {
                            src: imageSrc,
                            name: imageName,
                            tags: tags
                          }
                          cassandraServiceClient.makeRequest('insert', useruuid, image, (dbErr, result) => {
                            if (dbErr) {
                              logger.error(dbErr)
                              storageService.deleteImage(useruuid, imageName, (err, deleted) => {
                                if (err) {
                                  writeError(res, 603, err)
                                } else {
                                  writeError(res, 701, dbErr)
                                }
                              })
                            } else {
                              if (result.errorMessage) {
                                storageService.deleteImage(useruuid, imageName, (err, deleted) => {
                                  if (err) {
                                    logger.error(err)
                                  } else {
                                    writeError(res, 701, result.errorMessage)
                                  }
                                })
                              } else {
                                writeSuccess(res)
                              }
                            }
                            fs.unlinkSync(newPath)
                          })
                        })
                      } else {
                                                // If no tags from detection there is no point in keeping the image
                        storageService.deleteImage(useruuid, imageName, (err, deleted) => {
                          if (err) {
                            writeError(res, 603, err)
                          } else {
                            writeError(res, 604)
                          }
                          fs.unlinkSync(newPath)
                        })
                      }
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  } else if (req.method === 'DELETE' && req.url === '/file') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        let jsonBody = JSON.parse(body)
        let image = {
          imageuuid: jsonBody.image.imageuuid,
          imageName: jsonBody.image.imageName
        }
        storageService.deleteImage(jsonBody.useruuid, jsonBody.image.imageName, (err, deleted) => {
          if (err) {
            writeError(res, 603, err)
          } else {
            cassandraServiceClient.makeRequest('delete', jsonBody.useruuid, image, (err, deleted) => {
              if (err) {
                writeError(res, 702, err)
              } else {
                writeSuccess(res)
              }
            })
          }
        })
      } catch (e) {
        writeError(res, 500, e)
      }
    })
  } else {
    writeError(res, 404)
  }
}
