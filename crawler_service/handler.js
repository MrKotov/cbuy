const olxCrawler = require('./crawlers/olx-bg')
var url = require('url')

const headers = {
  'Content-Type': 'application/json'
}
let queryData = ''

module.exports = (req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/olx')) {
    queryData = url.parse(req.url, true).query
    queryData.tags = decodeURIComponent(queryData.tags)
    let olxQuery = olxCrawler.olxQueryComposer(queryData.tags.split(',').join(' '), true, true, null, queryData.nextPageToken)
    olxCrawler.getOlxOffers(olxQuery, (err, result) => {
      if (err) {
        res.writeHead(500, headers)
        res.write('Could not find results.')
      } else {
        res.writeHead(200, headers)
        res.write(JSON.stringify(result))
      }
      res.end()
    })
  } else {
    res.writeHead(404, headers)
    res.write('Not found.')
    res.end()
  }
}
