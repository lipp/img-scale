const https = require('https')
const http = require('http')
const sharp = require('sharp')
const querystring = require('querystring')
const url = require('url')
const { send } = require('micro')
const twoYears = 60 * 60 * 24 * 365 * 2
const get = {
  ['https:']: https.get,
  ['http:']: http.get
}
module.exports = (req, res) => {
  const {
    width,
    height,
    url: imageUrl,
    quality,
    format = 'jpeg'
  } = querystring.parse(req.url.split('?')[1])
  if (!imageUrl) {
    send(res, 422, 'Missing required "url" query param')
    return
  }
  console.log(format)
  const protocol = url.parse(imageUrl).protocol
  get[protocol](imageUrl, imageRes => {
    if (imageRes.statusCode !== 200) {
      send(res, 404, `Could not get image "url=${imageUrl}"`)
      return
    }
    res.setHeader('Content-Type', `image/${format}`)
    res.setHeader('Cache-Control', `max-age=${twoYears}, s-maxage=${twoYears}`)
    imageRes
      .pipe(
        sharp()
          .resize({
            width: width ? parseInt(width, 10) : undefined,
            height: height ? parseInt(height, 10) : undefined,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
          })
          [format]({
            quality: quality ? parseInt(quality, 10) : 50
          })
      )
      .pipe(res)
  })
}
