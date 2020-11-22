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
    ws = new WebSocket('ws://127.0.0.1:8088');// TMP hardcoded uri wss://sophiadigitalart.fr/ws/);
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
    ws.onopen = function (evt) { console.log('WebSocket opened') };
    ws.onclose = function (evt) {
      console.log('WebSocket closed')
    };
  });
  
  console.log(`ws url: ${process.env.WSURL} or ${process.env.WSURL || 'ws://127.0.0.1:8088'}`);
  window.socket = new ws(`${process.env.WSURL || 'ws://127.0.0.1:8088'}`);//8091 51.210.25.83
  // websocket end

  // 20200703 borrino!
  setInterval(function () {
    // random sketch menu.shuffleSketches()
    // random values editor.mutator.mutate({reroll: false});
    if (window.ws.readyState != 1) {
      console.log(`window.ws.readyState ${window.ws.readyState} != 1 `)
      console.log(`WebSocket connection retry ${window.ws.url} = ${process.env.WSURL} = 'ws://127.0.0.1:8088`)
      window.ws = new WebSocket('ws://127.0.0.1:8088');
      console.log(`window.ws.readyState: ${window.ws.readyState}`)
      window.ws.onmessage = function (evt) {
        var messageData = JSON.parse(evt.data);
        if (messageData.event) {
          if (messageData.event == 'editortext') {
            let code = messageData.message
            editor.setValue(code)
            repl.eval(code)
          } 
        }
      };
      window.ws.send = function (data) {
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
