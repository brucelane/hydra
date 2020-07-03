const log = require('./log.js').log

module.exports = {
  eval: (arg, callback) => {
    var self = this
    var jsString = arg
    var isError = false
    try {
      eval(jsString)
      // log(jsString)
      console.log('send to ws server')
      // 20200703 bruce
      if (window.socket) {
        console.log('window.socket ok')
        try {
          //window.socket.send(JSON.stringify({event:'editortext', message: JSON.stringify(jsString) }));
          window.socket.send(JSON.stringify({event:'editortext', message: jsString }));
        } catch (e) {
          // handle error (server not connected for example)
          console.log(" websocket error", JSON.stringify(e))
        }
      }
      /* before 25 september 2019 OK
      if (window.socket) {
        try {
          window.socket.send(JSON.stringify({event:'frag', message: this.compile(pass)}));
          window.socket.send(JSON.stringify({event:'hydra', message: JSON.stringify(pass) }));
        } catch (e) {
          // handle error (server not connected for example)
          console.log(" websocket error", JSON.stringify(e))
        }
      } */


      log('')
    } catch (e) {
      isError = true
      console.log("logging", e)
      // var err = e.constructor('Error in Evaled Script: ' + e.message);
      // console.log(err.lineNumber)
      log(e.message, "log-error")
      //console.log('ERROR', JSON.stringify(e))
    }
  //  console.log('callback is', callback)
    if(callback) callback(jsString, isError)
  }
}
