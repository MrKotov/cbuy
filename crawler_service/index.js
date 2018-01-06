const olxCrawler = require('./crawler')

const query = olxCrawler.olxQueryComposer('iphone', true, true, false)

olxCrawler.getOlxOffers(query, (err, offers) => {
  if (err) {
    console.log(err)
  } else {
    console.log(offers.offersArray, offers.offerNextPage, offers.offersLastPage)
  }
})
