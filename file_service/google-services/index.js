const visionService = require('./vision.service')
const translationService = require('./translation.service')
const storageService = require('./storage.service')

module.exports = {
  visionService: visionService.getImageTags,
  translationService: translationService.translateTags,
  storageService: storageService
}
