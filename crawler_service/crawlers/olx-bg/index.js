'use strict'

const https = require('https')
const zlib = require('zlib')
const cheerio = require('cheerio')

module.exports = {

  olxQueryComposer: function (searchQuery, searchInDescription, searchWithPhotosOnly, searchWithCourierOnly, nextPageToken) {
    if (!searchQuery) {
      return undefined
    }

    let queryString = 'q-'
    let encodedSearchQuery = encodeURIComponent(searchQuery.replace(' ', '-')) + '/?'
    queryString += encodedSearchQuery

    if (searchInDescription) {
      queryString += '&search[description]=1'
    }
    if (searchWithPhotosOnly) {
      queryString += '&search[photos]=1'
    }
    if (searchWithCourierOnly) {
      queryString += '&search[courier]=1'
    }
    if (nextPageToken) {
      queryString += '&page=' + nextPageToken
    }

    return Object.freeze(queryString)
  },

  getOlxOffers: function getOlxOffers (olxQuery, callback) {
    getOlxRaw(olxQuery, (err, htmlContent) => {
      if (err) {
        callback(err)
      } else {
        processOlxRequest(htmlContent, (err, data) => {
          if (err) {
            callback(err)
          } else {
            callback(null, data)
          }
        })
      }
    })
  }
}

function getOlxRaw (olxQuery, callback) {
  const options = {
    hostname: 'www.olx.bg',
    port: 443,
    path: '/ads/' + olxQuery,
    method: 'GET',
    headers: {
      'Accept-Encoding': 'gzip',
      'Content-Type': 'text/html; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0'
    }
  }
  let buffer = []
  const req = https.request(options, (resp) => {
    const gunzip = zlib.createGunzip()
    resp.pipe(gunzip)
    gunzip.on('data', function (data) {
      buffer.push(data.toString())
    }).on('end', function () {
      callback(null, buffer.join(''))
    }).on('error', function (err) {
      callback(err)
    })
  })
  req.on('error', (err) => {
    callback(err)
  })
  req.end()
}

function Offer (offerImage, offerDescription, offerUrl, offerPrice) {
  this.offerImage = offerImage
  this.offerDescription = offerDescription
  this.offerUrl = offerUrl
  this.offerPrice = offerPrice

  if (!(this instanceof Offer)) {
    return new Offer(offerImage, offerDescription, offerUrl, offerPrice)
  }
}

function processOlxRequest (htmlContent, callback) {
  try {
    const $ = cheerio.load(htmlContent, {
      ignoreWhitespace: true,
      xmlMode: false,
      lowerCaseTags: false
    })
    const offersArray = []
    const offerImagesAndDescriptionsArray = $('a.thumb')
    const offerRealUrlsArray = $('a.marginright5')
    const offerPricesArray = $('p.price')
    const offerPrevNextPage = $('a.pageNextPrev')
    const offersDisplayedPages = $('a.block.br3.brc8.large.tdnone.lheight24')
    const offersLastPage = offersDisplayedPages[offersDisplayedPages.length - 1].children[1].children[0].data || 0
    let offerNextPage = ''
    if (offerPrevNextPage.length === 2) {
      offerNextPage = offerPrevNextPage[1].attribs.href.split('page=')[1]
    } else {
      offerNextPage = offerPrevNextPage[0].attribs.href.split('page=')[1]
    }

    if (offerImagesAndDescriptionsArray.length !== offerRealUrlsArray.length ||
            offerImagesAndDescriptionsArray.length !== offerPricesArray.length) {
      let err = 'Mismatch amongst array lenghts.'
      return callback(err, null)
    }

    for (let i = 0; i < offerImagesAndDescriptionsArray.length; i++) {
      offersArray.push(
                new Offer(
                    offerImagesAndDescriptionsArray[i].children[1].attribs.src,
                    offerImagesAndDescriptionsArray[i].children[1].attribs.alt,
                    offerRealUrlsArray[i].attribs.href,
                    offerPricesArray[i].children[1].children[0].data)
            )
    }
    return callback(null, { offersArray, offerNextPage, offersLastPage })
  } catch (e) {
    return callback(e)
  }
}
