const fs = require('fs')
const path = require('path')

// if on glitch, force https
module.exports = (app) => {
  var server
  if(process.env.SDA) {
    console.log("http, sda")
    var http = require('http')
    server = http.createServer(app)
  } else if(process.env.GLITCH) {
    var http = require('http')
    server = http.createServer(app)

    function checkHttps(req, res, next){
    if(req.get('X-Forwarded-Proto').indexOf("https")!=-1){
        console.log("https, glitch")
        return next()
      } else {
        res.redirect('https://' + req.hostname + req.url);
      }
    }

    app.all('*', checkHttps)
  } else {
    console.log("https, sda.fr")
    // tmp
    var http = require('http')
    server = http.createServer(app)
    //var https = require('https')
    //var privateKey = fs.readFileSync(path.join(__dirname, '/certs/key.pem'), 'utf8')
    //var certificate = fs.readFileSync(path.join(__dirname, '/certs/certificate.pem'), 'utf8')
    //var privateKey = fs.readFileSync('/etc/letsencrypt/live/sophiadigitalart.fr/privkey.pem', 'utf8')
    //var certificate = fs.readFileSync('/etc/letsencrypt/live/sophiadigitalart.fr/fullchain.pem', 'utf8')
    //var credentials = {key: privateKey, cert: certificate}
    //server = https.createServer(credentials, app)
  }
  return server
}
