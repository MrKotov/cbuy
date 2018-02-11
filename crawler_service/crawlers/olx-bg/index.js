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
    const offers = $('.offer').toArray()
    for (let offer of offers) {
      if (offer.children[1].children.length === 0 || offer.children[1].childNodes[1].children[1].childNodes[5].children[1].children.length === 1) {

      } else if (offer.children[1].childNodes[1].children[1].childNodes[5].children[1].children[1].children[1].children[0].data) {
        let base = offer.children[1].childNodes[1].children[1].children[1].children[1]
        let href = base.attribs.href
        let image = base.children[1].attribs.src
        let alt = base.children[1].attribs.alt
        let price = offer.children[1].childNodes[1].children[1].childNodes[5].children[1].children[1].children[1].children[0].data
        offersArray.push(
          new Offer(image, alt, href, price)
        )
      }
    }

    const offerPrevNextPage = $('a.pageNextPrev')
    const offersDisplayedPages = $('a.block.br3.brc8.large.tdnone.lheight24')
    const offersLastPage = offersDisplayedPages.length === 0 ? 1 : offersDisplayedPages[offersDisplayedPages.length - 1].children[1].children[0].data || 0
    let offerNextPage = ''
    if (offerPrevNextPage.length === 1) {
      offerNextPage = offerPrevNextPage[0].attribs.href.split('page=')[1]
    } else if (offerPrevNextPage.length === 2) {
      offerNextPage = offerPrevNextPage[1].attribs.href.split('page=')[1]
    }
    return callback(null, { offersArray, offerNextPage, offersLastPage })
  } catch (e) {
    return callback(e)
  }
}
