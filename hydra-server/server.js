// load environmental variables contained in .env file
require('dotenv').config()

const fs = require('fs')
const express = require('express')
const app = express()
const browserify = require('browserify-middleware')
const path = require('path')
// 20200630 const configureSSL = require('./configure-ssl.js')
// 20200630  var server = configureSSL(app)
var server = app
//
require('dotenv').config()

require('./twitter-gallery.js')(app)

// crear un servidor en puerto 8000
server.listen(8000, function () {
  // imprimir la direccion ip en la consola
  // console.log('servidor disponible en https://'+myip.getLocalIP4()+':8000')
  console.log('server available at http://localhost:8000')
})

app.use(express.static(path.join(__dirname, '/public')))
app.use(express.static('/public'))
server.use(express.static(path.join(__dirname, '/public')))
console.log('end')