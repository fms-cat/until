/* globals PRODUCTION */

// == import various modules / stuff ===========================================
import { Audio } from './audio.js';
import { Xorshift } from './libs/xorshift';
import GLCat from './libs/glcat.js';
import GLCatPath from 'glcat-path';
import MathCat from './libs/mathcat.js';
import * as UltraCat from './libs/ultracat.js';
import Automaton from '@fms-cat/automaton';

import CONFIG from './config.json';

// == make dom =================================================================
document.body.style.margin = 0;
document.body.style.padding = 0;

const canvas = document.createElement( 'canvas' );

if ( PRODUCTION ) {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';

  const button = document.createElement( 'a' );
  document.body.appendChild( button );
  button.innerHTML = 'click me!';

  button.onclick = () => {
    document.body.appendChild( canvas );
    automaton.play();
    if ( document.body.requestFullscreen ) { document.body.requestFullscreen(); }
    else if ( document.body.webkitRequestFullscreen ) { document.body.webkitRequestFullscreen(); }
    else if ( document.body.mozRequestFullscreen ) { document.body.mozRequestFullscreen(); }
  };
}

if ( !PRODUCTION ) {
  document.body.appendChild( canvas );
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

// == gl stuff =================================================================
const hashReso = location.hash.match( /\d+/g ) || [ 3840, 2160 ];
let width = canvas.width = parseInt( hashReso[ 0 ] );
let height = canvas.height = parseInt( hashReso[ 1 ] );

const gl = canvas.getContext( 'webgl' );
gl.lineWidth( 1 ); // e

const glCat = new GLCat( gl );
glCat.getExtension( 'OES_texture_float', true );
glCat.getExtension( 'OES_texture_float_linear', true );
glCat.getExtension( 'EXT_frag_depth', true );
glCat.getExtension( 'ANGLE_instanced_arrays', true );

const glCatPath = new GLCatPath( glCat, {
  el: window.divPath,
  canvas: canvas,
  stretch: true,
  drawbuffers: true
} );
glCatPath.commonShader = require( './shaders/-common.glsl' );

// oh hi
const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

// == jikan ga nai ===========================================================
const doAt = ( t, func ) => {
  if (
    automaton.time - automaton.deltaTime <= t &&
    t < automaton.time
  ) {
    func();
  }
};

// == wow it's aural contents ==================================================
const audio = new Audio( { glCatPath } );

if ( !PRODUCTION ) {
  audio.play();
}

const beat2time = ( beat ) => beat * 60.0 / 160.0;
const time2beat = ( beat ) => beat / 60.0 * 160.0;

// == prepare random texture ===================================================
const seed = 4891789626782;
let xorshift = new Xorshift( seed );

const textureRandomUpdate = ( _tex, _size ) => {
  glCat.setTextureFromArray( _tex, _size, _size, ( () => {
    let len = _size * _size * 4;
    let ret = new Uint8Array( len );
    for ( let i = 0; i < len; i ++ ) {
      ret[ i ] = Math.floor( xorshift.gen() * 256.0 );
    }
    return ret;
  } )() );
};

const textureRandomStatic = glCat.createTexture();
glCat.textureWrap( textureRandomStatic, gl.REPEAT );
textureRandomUpdate( textureRandomStatic, 2048 );

const textureRandomDynamic = glCat.createTexture();
glCat.textureWrap( textureRandomDynamic, gl.REPEAT );

// == hello automaton ==========================================================
let totalFrame = 0;
let isInitialFrame = true;

const automaton = new Automaton( {
  gui: window.divAutomaton,
  data: require( './automaton-still.json' ),
  fps: 60
} );
const auto = automaton.auto;
automaton.seek( 95.0 );

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

// == lights, camera, action! ==================================================
let viewport = [ 0.0, 0.0, 0.2, 0.2 ];

let cameraPos = [ 0.0, 0.0, 0.0 ];
let cameraTar = [ 0.0, 0.0, 0.0 ];
let cameraRoll = 0.0; // protip: considering roll of cam is cool idea

let perspFov = 90.0;
let perspNear = 0.1;
let perspFar = 20.0;

let lightPos = [ 1.0, 0.4, 5.0 ]; // this is pretty random
let lightCol = [ 1.0, 1.0, 1.0 ]; // todo-ish

const shadowReso = CONFIG.shadowReso; // texture size for shadow buffer

let matP = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );
let matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
let matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );

const updateMatrices = ( camOffset ) => {
  perspFov = 90.0 * auto( 'camera-fov' );

  cameraPos = [ 0.0, 0.0, auto( 'camera-Radius' ) ];
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotX', { smooth: 10.0 } ), [ 1.0, 0.0, 0.0 ] ) );
  cameraPos = MathCat.rotateVecByQuat( cameraPos, MathCat.quatAngleAxis( auto( 'camera-rotY', { smooth: 10.0 } ), [ 0.0, 1.0, 0.0 ] ) );
  if ( camOffset ) { cameraPos = MathCat.vecAdd( cameraPos, camOffset ); }

  const viewportCx = -2.0 * ( ( viewport[ 0 ] + viewport[ 2 ] * 0.5 ) - 0.5 ) / viewport[ 2 ];
  const viewportCy = -2.0 * ( ( viewport[ 1 ] + viewport[ 3 ] * 0.5 ) - 0.5 ) / viewport[ 3 ];
  matP = MathCat.mat4Apply(
    [
      1.0 / viewport[ 2 ], 0.0, 0.0, 0.0,
      0.0, 1.0 / viewport[ 3 ], 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      viewportCx * width / height, viewportCy, 0.0, 1.0
    ],
    MathCat.mat4Perspective( perspFov, perspNear, perspFar )
  );
  matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );

  matPL = MathCat.mat4Perspective( perspFov, perspNear, perspFar );
  matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );
};
updateMatrices();

// == mouse listener, why tho ==================================================
let mouseX = 0.0;
let mouseY = 0.0;

canvas.addEventListener( 'mousemove', ( event ) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
} );

// == global uniform variables =================================================
glCatPath.setGlobalFunc( () => {
  glCat.uniform1i( 'isInitialFrame', isInitialFrame );

  glCat.uniform1f( 'time', automaton.time );
  glCat.uniform1f( 'progress', automaton.progress );
  glCat.uniform1f( 'deltaTime', automaton.deltaTime );
  glCat.uniform1f( 'totalFrame', totalFrame );

  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform3fv( 'cameraTar', cameraTar );
  glCat.uniform1f( 'cameraRoll', cameraRoll );

  glCat.uniform1f( 'perspFov', perspFov );
  glCat.uniform1f( 'perspNear', perspNear );
  glCat.uniform1f( 'perspFar', perspFar );

  glCat.uniform3fv( 'lightPos', lightPos );
  glCat.uniform3fv( 'lightCol', lightCol );

  glCat.uniformMatrix4fv( 'matP', matP );
  glCat.uniformMatrix4fv( 'matV', matV );
  glCat.uniformMatrix4fv( 'matPL', matPL );
  glCat.uniformMatrix4fv( 'matVL', matVL );

  glCat.uniformTexture( 'samplerRandomStatic', textureRandomStatic, 15 );
  glCat.uniformTexture( 'samplerRandomDynamic', textureRandomDynamic, 14 );

  glCat.uniform2fv( 'mouse', [ mouseX, mouseY ] );

  glCat.uniform2fv( 'zOffset', [ zOffset[ 0 ], auto( 'dzOffset' ) ] );

  glCat.uniform3fv( 'bgColor', [ 0.0, 0.0, 0.0 ] );

  glCat.uniform4fv( 'viewport', viewport );
} );

// == glcat-path setup =========================================================
glCatPath.add( {
  return: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/return.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  inspector: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/inspector.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform3fv( 'circleColor', [ 1.0, 1.0, 1.0 ] );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  tone: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/tone.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  target: {
    width: width,
    height: height,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 0.0 ],
    framebuffer: true,
    float: true,
    drawbuffers: 3,
    depthWrite: false,
    func: () => {
      // glCat.attribute( 'p', vboQuad, 2 );
      // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  shadow: {
    width: shadowReso,
    height: shadowReso,
    vert: require( './shaders/quad.vert' ),
    frag: require( './shaders/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ perspFar, 0.0, 0.0, 0.0 ],
    framebuffer: true,
    float: true,
    func: () => {
      // glCat.attribute( 'p', vboQuad, 2 );
      // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
} );

// == setup paths ==============================================================
const context = {
  glCatPath: glCatPath,
  automaton: automaton,
  width: width,
  height: height
};

const log = require( './paths/log' ).default( context );
context.log = log;

require( './paths/bloom' ).default( context );
require( './paths/box' ).default( context );
require( './paths/circle' ).default( context );
require( './paths/distance' ).default( context );
require( './paths/dof' ).default( context );
require( './paths/patterns' ).default( context );
require( './paths/particles' ).default( context );
require( './paths/postfx' ).default( context );
require( './paths/racer' ).default( context );
require( './paths/raymarch' ).default( context );
require( './paths/render' ).default( context );
require( './paths/trails' ).default( context );
require( './paths/ui' ).default( context );
require( './paths/very-plane' ).default( context );

// == loop here ================================================================
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

  // == update bunch of shit ===================================================
  updateMatrices();

  // == let's render this ======================================================
  glCatPath.begin();

  if ( automaton.time <= 99.5 ) {
    automaton.update();
    audio.setTime( automaton.time );
    zOffset[ 0 ] += 0.0;//auto( 'dzOffset' ) * automaton.deltaTime;
    textureRandomUpdate( textureRandomDynamic, 32 );

    // == compute particles ======================================================
    glCatPath.render( 'patternsCompute', {
      enable: beat2time( 16.0 ) < automaton.time
    } );
    glCatPath.render( 'particlesCompute', {
      enable: beat2time( 16.0 ) < automaton.time
    } );
    glCatPath.render( 'trailsCompute', {
      enable: beat2time( 16.0 ) < automaton.time
    } );
    glCatPath.render( 'racerCompute', {
      enable: beat2time( 16.0 ) < automaton.time
    } );

    for ( let i = 0; i < 3; i ++ ) {
      glCatPath.render( 'logCompute', {
        enable: beat2time( 16.0 ) < automaton.time
      } );
    }
  }

  if ( 99.5 < automaton.time ) {
    // == shadow =================================================================
    glCatPath.render( 'shadow' );

    glCatPath.render( 'box', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'shadow' ),
      isShadow: true,
      width: shadowReso,
      height: shadowReso
    } );

    glCatPath.render( 'raymarch', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'shadow' ),
      isShadow: true,
      width: shadowReso,
      height: shadowReso
    } );

    glCatPath.render( 'trailsRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'shadow' ),
      isShadow: true,
      width: shadowReso,
      height: shadowReso
    } );

    glCatPath.render( 'particlesRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'shadow' ),
      isShadow: true,
      width: shadowReso,
      height: shadowReso
    } );

    glCatPath.render( 'veryPlane', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'shadow' ),
      isShadow: true,
      width: shadowReso,
      height: shadowReso
    } );

    // == foreground =============================================================
    glCatPath.render( 'target' );

    glCatPath.render( 'box', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'patternsRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'raymarch', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'circle', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      totalFrame: totalFrame,
      width: width,
      height: height
    } );

    glCatPath.render( 'particlesRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'racerRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'trailsRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    glCatPath.render( 'veryPlane', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    // == ui =====================================================================
    glCatPath.render( 'ui', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height,
      analyserData: audio.getAnalyserData()
    } );

    glCatPath.render( 'logRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    // == render =================================================================
    glCatPath.render( 'render', {
      enable: beat2time( 16.0 ) < automaton.time,
      inputs: glCatPath.fb( 'target' ).textures,
      shadow: glCatPath.fb( 'shadow' ).texture,
      width: width,
      height: height
    } );

    // == post ===================================================================
    glCatPath.render( 'distance', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: glCatPath.fb( 'target' ).textures[ 0 ],
      width: width,
      height: height
    } );

    glCatPath.render( 'dof', {
      enable: beat2time( 16.0 ) < automaton.time,
      dry: glCatPath.fb( 'render' ).texture,
      depth: glCatPath.fb( 'distance' ).texture,
      width: width,
      height: height
    } );

    // == post 2 =================================================================
    glCatPath.render( 'preBloom', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: glCatPath.fb( 'dof' ).texture,
      bias: [ -0.9, -0.9, -0.9 ],
      factor: [ 1.0, 1.0, 1.0 ]
    } );
    glCatPath.render( 'bloom', {
      enable: beat2time( 16.0 ) < automaton.time
    } );
    glCatPath.render( 'postBloom', {
      enable: beat2time( 16.0 ) < automaton.time,
      dry: glCatPath.fb( 'dof' ).texture
    } );

    glCatPath.render( 'post', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: glCatPath.fb( 'postBloom' ).texture
    } );

    glCatPath.render( 'fxaa', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: glCatPath.fb( 'post' ).texture
    } );

    glCatPath.render( 'glitch', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: (
        automaton.time < beat2time( 234.0 ) ? glCatPath.fb( 'fxaa' ).texture :
        automaton.time < beat2time( 234.5 ) ? glCatPath.fb( 'render' ).texture :
        automaton.time < beat2time( 235.5 ) ? glCatPath.fb( 'fxaa' ).texture :
        automaton.time < beat2time( 236.0 ) ? glCatPath.fb( 'distance' ).texture :
        automaton.time < beat2time( 237.5 ) ? glCatPath.fb( 'fxaa' ).texture :
        automaton.time < beat2time( 238.0 ) ? glCatPath.fb( 'target' ).textures[ 0 ] :
        automaton.time < beat2time( 238.5 ) ? glCatPath.fb( 'fxaa' ).texture :
        automaton.time < beat2time( 239.0 ) ? glCatPath.fb( 'target' ).textures[ 1 ] :
        glCatPath.fb( 'fxaa' ).texture
      )
    } );

    glCatPath.render( 'return', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: GLCatPath.nullFb,
      input: glCatPath.fb( 'glitch' ).texture
    } );

    // glCatPath.render( 'inspector', {
    //   target: GLCatPath.nullFb,
    //   input: glCatPath.fb( 'shadow' ).texture
    // } );
    glCatPath.render( 'tone', {
      enable: automaton.time < beat2time( 16.0 ),
      target: GLCatPath.nullFb
    } );
  }

  // == end ====================================================================
  glCatPath.end();

  if ( 99.5 < automaton.time ) {
    window.checkActive.checked = false;
  }

  // == finalize the loop ======================================================
  isInitialFrame = false;
  totalFrame ++;

  requestAnimationFrame( update );
};

update();

// == keyboard is good =========================================================
window.addEventListener( 'keydown', ( event ) => {
  if ( PRODUCTION ) {
    if ( event.which === 27 ) { // panic button
      window.aaaaaaaaaaa = true;
      audio.pause();
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

    if ( event.which === 37 ) { // Left
      viewport[ 0 ] -= 0.2 * 0.8;
      window.checkActive.checked = true;
    }

    if ( event.which === 38 ) { // Up
      viewport[ 1 ] += 0.2 * 0.8;
      window.checkActive.checked = true;
    }

    if ( event.which === 39 ) { // Right
      viewport[ 0 ] += 0.2 * 0.8;
      window.checkActive.checked = true;
    }

    if ( event.which === 40 ) { // Down
      viewport[ 1 ] -= 0.2 * 0.8;
      window.checkActive.checked = true;
    }
  }
} );