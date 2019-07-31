/* globals PRODUCTION */

// == import various modules / stuff ===============================================================
import { VRCat } from './libs/vrcat.js';
import Automaton from '@fms-cat/automaton';
import MathCat from './libs/mathcat.js';
import { Scene } from './scene';
import CONFIG from './config.json';

// == make dom =====================================================================================
document.body.style.margin = 0;
document.body.style.padding = 0;

const canvas = document.createElement( 'canvas' );

const button = document.createElement( 'a' );
document.body.appendChild( button );
button.innerHTML = 'click me!';

button.onclick = () => {
  beginExperience( false );
};

const vrButton = document.createElement( 'a' );
document.body.appendChild( vrButton );
vrButton.innerHTML = 'VR mode';

vrButton.onclick = () => {
  beginExperience( true );
};

if ( PRODUCTION ) {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';
}

if ( !PRODUCTION ) {
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';

  window.divPath = document.createElement( 'div' );
  document.body.appendChild( window.divPath );
  window.divPath.style.position = 'fixed';
  window.divPath.style.textAlign = 'right';
  window.divPath.style.right = '8px';
  window.divPath.style.bottom = '248px';
  window.divPath.style.textShadow = '1px 1px 1px #ffffff';

  window.divAutomaton = document.createElement( 'divAutomaton' );
  document.body.appendChild( window.divAutomaton );
  window.divAutomaton.style.position = 'fixed';
  window.divAutomaton.style.width = '100%';
  window.divAutomaton.style.height = '240px';
  window.divAutomaton.style.right = 0;
  window.divAutomaton.style.bottom = 0;

  window.checkActive = document.createElement( 'input' );
  document.body.appendChild( window.checkActive );
  window.checkActive.type = 'checkbox';
  window.checkActive.checked = true;
  window.checkActive.style.position = 'fixed';
  window.checkActive.style.left = '8px';
  window.checkActive.style.bottom = '248px';
}

// == yo ===========================================================================================
let scene = null;

// == hello automaton ============================================================================
const automaton = new Automaton( {
  gui: window.divAutomaton,
  data: require( './automaton.json' ),
} );
const auto = automaton.auto;

automaton.on( 'play', () => { scene.audio.play(); } );
automaton.on( 'pause', () => { scene.audio.pause(); } );
automaton.on( 'seek', () => {
  scene.audio.setTime( automaton.time );
  zOffset[ 0 ] = 0.0;
} );

if ( PRODUCTION ) {
  automaton.pause();
}

automaton.addFxDefinition( 'sine', {
  name: 'Sinewave',
  params: {
    amp: { name: 'Amp', type: 'float', default: 0.1 },
    freq: { name: 'Frequency', type: 'float', default: 5.0 },
    phase: { name: 'Phase', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
  },
  func( context ) {
    const v = context.v;
    const p = context.progress * context.params.freq + context.params.phase;
    return v + context.params.amp * Math.sin( p * Math.PI * 2.0 );
  }
} );

automaton.addFxDefinition( 'repeat', {
  name: 'Repeat',
  params: {
    duration: { name: 'Duration', type: 'float', default: 1.0, min: 0.0 }
  },
  func( context ) {
    const d = context.params.duration;
    if ( d === 0.0 ) { return context.v; }

    const t = context.t0 + ( context.t - context.t0 ) % d;
    return context.getValue( t );
  }
} );

let zOffset = [ 0.0 ];

if ( module.hot ) {
  module.hot.accept(
    './automaton.json',
    () => automaton.load( require( './automaton.json' ) )
  );
}

// == cam ==========================================================================================
let cameraPos = [ 0.0, 0.0, 0.0 ];
let cameraTar = [ 0.0, 0.0, 0.0 ];
let cameraRoll = 0.0; // protip: considering roll of cam is cool idea

let perspFov = 90.0;
let perspNear = CONFIG.near;
let perspFar = CONFIG.far;

let matP = MathCat.mat4Perspective( 90.0, 0.01, CONFIG.far );
let matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );

const updateMatrices = ( camOffset ) => {
  perspFov = 90.0 * auto( 'camera-fov' );

  cameraPos = [ 0.0, 0.0, auto( 'camera-Radius' ) ];
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotX', { smooth: 10.0 } ), [ 1.0, 0.0, 0.0 ] ) );
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotY', { smooth: 10.0 } ), [ 0.0, 1.0, 0.0 ] ) );
  if ( camOffset ) { cameraPos = MathCat.vecAdd( cameraPos, camOffset ); }

  matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );
};
updateMatrices();

// == begin ========================================================================================
const resoMul = parseFloat( location.hash.match( /[0-9.]+/ ) ) || 1;
function beginExperience( isVR ) {
  document.body.appendChild( canvas );

  if ( isVR ) {
    if ( vrCat.isSupported ) {
      vrCat.createSession().then( ( session ) => {
        const gl = canvas.getContext( 'webgl', { compatibleXRDevice: session.session.device } );

        vrCatSession = session;
        vrCatSession.setup( gl ).then( () => {
          scene = new Scene( {
            gl,
            canvas,
            isVR: true,
            multiplier: resoMul,
            automaton,
            zOffset
          } );

          vrCatSession.onFrame = ( obj ) => {
            if ( PRODUCTION ) {
              if ( window.aaaaaaaaaaa ) {
                return;
              }
            }

            if ( !PRODUCTION ) {
              if ( !window.checkActive.checked ) {
                return;
              }
            }

            const isFirstView = obj.iView === 0;
            const isLastView = obj.iView === obj.nView - 1;
            if ( isFirstView ) {
              automaton.update( scene.audio.getTime() );
            }

            const matPVR = obj.projectionMatrix;
            matPVR[ 10 ] = -matP[ 10 ];
            matPVR[ 11 ] = -matP[ 11 ];
            matPVR[ 14 ] = matP[ 14 ];

            const fovMul = Math.tan( 0.25 * Math.PI * auto( 'camera-fov' ) );
            const matV = MathCat.mat4Apply(
              obj.viewMatrix,
              MathCat.mat4Scale( [ 1.0, 1.0, fovMul ] ),
              MathCat.mat4Translate( [ 0.0, 0.0, -auto( 'camera-Radius' ) ] ),
            );

            perspFar = CONFIG.far * fovMul;

            scene.update( {
              isFirstView,
              isLastView,
              perspNear,
              perspFar,
              viewport: obj.viewport,
              matP: matPVR,
              matV
            } );
          };
        } );
      } );
    }
  } else {
    if ( PRODUCTION ) {
      if ( document.body.requestFullscreen ) { document.body.requestFullscreen(); }
      else if ( document.body.webkitRequestFullscreen ) { document.body.webkitRequestFullscreen(); }
      else if ( document.body.mozRequestFullscreen ) { document.body.mozRequestFullscreen(); }
    }

    const gl = canvas.getContext( 'webgl' );
    canvas.width = CONFIG.resolution[ 0 ];
    canvas.height = CONFIG.resolution[ 1 ];
    scene = new Scene( {
      gl,
      canvas,
      isVR: false,
      multiplier: resoMul,
      automaton,
      zOffset
    } );

    const update = () => {
      if ( PRODUCTION ) {
        if ( window.aaaaaaaaaaa ) {
          return;
        }
      }

      if ( !PRODUCTION ) {
        if ( !window.checkActive.checked ) {
          requestAnimationFrame( update );
          return;
        }
      }

      automaton.update( scene.audio.getTime() );
      updateMatrices();
      scene.update( {
        isFirstView: true,
        isLastView: true,
        perspNear,
        perspFar,
        viewport: [ 0, 0, CONFIG.resolution[ 0 ], CONFIG.resolution[ 1 ] ],
        matP,
        matV
      } );

      requestAnimationFrame( update );
    };
    update();
  }

  button.style.display = 'none';
  vrButton.style.display = 'none';
  automaton.play();
}

// == immersive vee-aar ============================================================================
const vrCat = new VRCat();
let vrCatSession = null;

vrCat.onDeviceChanged = () => {
  vrButton.style.display = vrCat.isSupported ? 'block' : 'none';
};

// == keyboard is good =============================================================================
window.addEventListener( 'keydown', ( event ) => {
  if ( PRODUCTION ) {
    if ( event.which === 27 ) { // panic button
      window.aaaaaaaaaaa = true;
      if ( scene ) {
        scene.audio.pause();
      }
    }
  }

  if ( !PRODUCTION ) {
    if ( event.which === 27 ) { // panic button
      window.checkActive.checked = false;
      automaton.pause();
    }

    if ( event.which === 32 ) { // play / pause
      automaton.isPlaying ? automaton.pause() : automaton.play();
    }
  }
} );
