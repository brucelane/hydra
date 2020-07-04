const PatchBay = require('./src/pb-live.js')
const HydraSynth = require('hydra-synth')
const Editor = require('./src/editor.js')
const loop = require('raf-loop')
const P5 = require('./src/p5-wrapper.js')
const Gallery = require('./src/gallery.js')
const Menu = require('./src/menu.js')
const keymaps = require('./keymaps.js')
const log = require('./src/log.js')
const repl = require('./src/repl.js')

function init() {
  window.pb = pb
  window.P5 = P5

  var canvas = document.getElementById('hydra-canvas')
  canvas.width = window.innerWidth * window.devicePixelRatio
  canvas.height = window.innerHeight * window.devicePixelRatio
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.imageRendering = 'pixelated'

  let isIOS =
    (/iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !window.MSStream;

  let precisionValue = isIOS ? 'highp' : 'mediump'

  var pb = new PatchBay()
  var hydra = new HydraSynth({ pb: pb, canvas: canvas, autoLoop: false, precision: precisionValue })
  var editor = new Editor()
  var menu = new Menu({ editor: editor, hydra: hydra })
  log.init()

  // get initial code to fill gallery
  var sketches = new Gallery(function (code, sketchFromURL) {
    editor.setValue(code)
    repl.eval(code)

    // if a sketch was found based on the URL parameters, dont show intro window
    if (sketchFromURL) {
      menu.closeModal()
    } else {
      menu.openModal()
    }
    menu.closeModal() // 20200703 bruce
  })
  menu.sketches = sketches

  keymaps.init({
    editor: editor,
    gallery: sketches,
    menu: menu,
    repl: repl,
    log: log
  })

  // define extra functions (eventually should be added to hydra-synth?)

  // hush clears what you see on the screen
  window.hush = () => {
    solid().out()
    solid().out(o1)
    solid().out(o2)
    solid().out(o3)
    render(o0)
  }


  pb.init(hydra.captureStream, {
    server: window.location.origin,
    room: 'iclc'
  })



  // bruce
  // websocket begin
  let peerConn = null;
  window.ws = (function (uri) {
    console.log(`ws init, uri: ${uri}`)
    ws = new WebSocket('wss://sophiadigitalart.fr/ws/');// TMP hardcoded uri);
    ws.onmessage = function (evt) {
      var messageData = JSON.parse(evt.data);

      if (messageData.event) {
        console.log('Received event from remote peer ' + messageData.event);
        if (messageData.event == 'editortext') {
          console.log('editortext message ' + messageData.message);

          let code = messageData.message
          editor.setValue(code)
          repl.eval(code)

        } 
      } else {
        console.log('Received unknown from remote peer ' + evt.data);
      }
  
    };
    this.emit = function (evt, data) {
      ws.send(JSON.stringify({ event: evt, message: data }));
    };
    this.send = function (data) {
      console.log('ws readyState' + ws.readyState);
      /*
      CONNECTING	0	
      OPEN	      1	
      CLOSING	    2	
      CLOSED	    3	
      */
      if (ws.readyState == 1) {
        ws.send(data);
      }
    };
    this.on = function (evt, func) {
      ws.addEventListener(evt, func);
    };
    ws.onerror = function (e) { console.log('error: ' + e) };
    ws.onopen = function (evt) { console.log('Socket opened') };
    ws.onclose = function (evt) {
      console.log('Socket closed')
    };
  });
  //window.socket = new ws('wss://sophiadigitalart.fr/ws/');8088 8089 8090
  console.log(`ws url: ${process.env.WSURL} or ${process.env.WSURL || 'wss://sophiadigitalart.fr/ws/'}`);
  window.socket = new ws(`${process.env.WSURL || 'wss://sophiadigitalart.fr/ws/'}`);//8091
  // websocket end

  // 20200703 borrino!
  setInterval(function () {
    // random sketch menu.shuffleSketches()
    // random values editor.mutator.mutate({reroll: false});
    if (window.ws.readyState != 1) {
      console.log('Socket connection retry')
      window.socket = new WebSocket('wss://sophiadigitalart.fr/ws/');
      console.log(`1 window.socket: ${window.socket}`)
      console.log(`2 window.ws: ${window.ws}`)
      window.ws = new WebSocket('wss://sophiadigitalart.fr/ws/');
      console.log(`3 window.ws: ${window.ws}`)
      window.ws.onmessage = function (evt) {
        var messageData = JSON.parse(evt.data);
        if (messageData.event) {
          console.log('4 Received ' + messageData.event);
          if (messageData.event == 'editortext') {
            console.log('5 editortext message ' + messageData.message);
  
            let code = messageData.message
            editor.setValue(code)
            repl.eval(code)
  
          } 
        } else {
          console.log('6 Received unknown from remote peer ' + evt.data);
        }
      };
      window.ws.send = function (data) {
        console.log('7 ws readyState' + ws.readyState);
        if (ws.readyState == 1) {
          ws.send(data);
        }
      };
    }
  }, 5000);

  var engine = loop(function (dt) {
    hydra.tick(dt)
  }).start()

}

window.onload = init
