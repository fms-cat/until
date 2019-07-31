/* globals PRODUCTION */

// == import various modules / stuff ===============================================================
import { Audio } from './audio.js';
import { Xorshift } from './libs/xorshift';
import GLCat from './libs/glcat.js';
import GLCatPath from 'glcat-path';
import MathCat from './libs/mathcat.js';
import * as UltraCat from './libs/ultracat.js';
import CONFIG from './config.json';

// == ha ===========================================================================================
const beat2time = ( beat ) => beat * 60.0 / 160.0;
const time2beat = ( beat ) => beat / 60.0 * 160.0;

// == yo ===========================================================================================
export class Scene {
  constructor( options ) {
    // == woolay ===================================================================================
    this.isInitialFrame = true;
    this.totalFrame = 0;
    this.canvas = options.canvas;
    this.multiplier = options.multiplier;
    this.isVR = options.isVR;
    const gl = this.gl = options.gl;
    const automaton = this.automaton = options.automaton;
    const auto = this.automaton.auto;
    const zOffset = this.zOffset = options.zOffset;

    // == hi gl ====================================================================================
    const glCat = this.glCat = new GLCat( this.gl );
    glCat.getExtension( 'OES_texture_float', true );
    glCat.getExtension( 'OES_texture_float_linear', true );
    glCat.getExtension( 'EXT_frag_depth', true );
    glCat.getExtension( 'ANGLE_instanced_arrays', true );
    glCat.getExtension( 'WEBGL_draw_buffers', true );

    const glCatPath = this.glCatPath = new GLCatPath( glCat, {
      el: window.divPath,
      canvas: this.canvas,
      stretch: true,
      drawbuffers: true
    } );
    glCatPath.commonShader = require( './shaders/-common.glsl' );

    // oh hi
    const vboQuad = this.vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

    // == wow it's aural contents ==================================================================
    const audio = this.audio = new Audio( { glCatPath } );

    if ( !PRODUCTION ) {
      audio.play();
    }

    // == prepare random texture ===================================================================
    const seed = 4891789626782;
    this.xorshift = new Xorshift( seed );

    this.textureRandomStatic = glCat.createTexture();
    glCat.textureWrap( this.textureRandomStatic, gl.REPEAT );
    this.textureRandomUpdate( this.textureRandomStatic, 2048 );

    this.textureRandomDynamic = glCat.createTexture();
    glCat.textureWrap( this.textureRandomDynamic, gl.REPEAT );

    // == mouse listener, why tho ==================================================================
    this.mouseX = 0.0;
    this.mouseY = 0.0;

    this.canvas.addEventListener( 'mousemove', ( event ) => {
      this.mouseX = event.offsetX;
      this.mouseY = event.offsetY;
    } );

    // == light settings ===========================================================================
    const lightPos = [ 1.0, 0.4, 5.0 ]; // this is pretty random
    const lightCol = [ 1.0, 1.0, 1.0 ]; // todo-ish

    const matPL = MathCat.mat4Perspective( 90.0, 0.01, 20.0 );
    const matVL = MathCat.mat4LookAt( lightPos, [ 0.0, 0.0, 0.0 ], [ 0.0, 1.0, 0.0 ], 0.0 );

    // == global uniform variables =================================================================
    this.matV = MathCat.mat4Identity();
    this.matP = MathCat.mat4Identity();
    this.perspNear = CONFIG.near;
    this.perspFar = CONFIG.far;

    glCatPath.setGlobalFunc( () => {
      glCat.uniform1i( 'isInitialFrame', this.isInitialFrame );
      glCat.uniform1i( 'isVR', this.isVR );
      glCat.uniform1f( 'totalFrame', this.totalFrame );

      glCat.uniform1f( 'time', automaton.time );
      glCat.uniform1f( 'progress', automaton.progress );
      glCat.uniform1f( 'deltaTime', automaton.deltaTime );

      glCat.uniform3fv( 'cameraPos', MathCat.vec3PosFromViewMatrix( this.matV ) );
      glCat.uniform1f( 'near', this.perspNear );
      glCat.uniform1f( 'far', this.perspFar );

      glCat.uniform3fv( 'lightPos', lightPos );
      glCat.uniform3fv( 'lightCol', lightCol );

      glCat.uniformMatrix4fv( 'matP', this.matP );
      glCat.uniformMatrix4fv( 'matV', this.matV );
      glCat.uniformMatrix4fv( 'matPL', matPL );
      glCat.uniformMatrix4fv( 'matVL', matVL );

      glCat.uniformTexture( 'samplerRandomStatic', this.textureRandomStatic, 15 );
      glCat.uniformTexture( 'samplerRandomDynamic', this.textureRandomDynamic, 14 );

      glCat.uniform2fv( 'mouse', [ this.mouseX, this.mouseY ] );

      glCat.uniform2fv( 'zOffset', [ zOffset[ 0 ], auto( 'dzOffset' ) ] );

      glCat.uniform3fv( 'bgColor', [ 0.0, 0.0, 0.0 ] );
    } );

    // == glcat-path setup =========================================================================
    glCatPath.add( {
      return: {
        vert: require( './shaders/quad.vert' ),
        frag: require( './shaders/return.frag' ),
        blend: [ gl.ONE, gl.ZERO ],
        func: ( path, params ) => {
          glCat.attribute( 'p', vboQuad, 2 );
          glCat.uniformTexture( 'sampler0', params.input, 0 );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      },

      inspector: {
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
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso,
        vert: require( './shaders/quad.vert' ),
        frag: require( './shaders/bg.frag' ),
        blend: [ gl.ONE, gl.ZERO ],
        clear: [ CONFIG.far, 0.0, 0.0, 0.0 ],
        framebuffer: true,
        float: true,
        func: () => {
          // glCat.attribute( 'p', vboQuad, 2 );
          // gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      },
    } );

    // == setup paths ==============================================================================
    const context = {
      glCatPath: glCatPath,
      automaton: this.automaton,
      isVR: this.isVR
    };

    this.log = require( './paths/log' ).default( context );
    context.log = this.log;

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
  }

  update( options ) {
    const automaton = this.automaton;
    const auto = automaton.auto;
    const viewport = options.viewport;
    const width = viewport[ 2 ] * this.multiplier;
    const height = viewport[ 3 ] * this.multiplier;
    const isFirstView = options.isFirstView;
    const isLastView = options.isLastView;

    this.zOffset[ 0 ] += auto( 'dzOffset' ) * automaton.deltaTime;
    this.matP = options.matP;
    this.matV = options.matV;
    this.perspNear = options.perspNear;
    this.perspFar = options.perspFar;
    this.textureRandomUpdate( this.textureRandomDynamic, 32 );

    // == let's render this ========================================================================
    if ( isFirstView ) {
      this.glCatPath.begin();
    }

    // == compute particles ========================================================================
    if ( isFirstView ) {
      this.glCatPath.render( 'patternsCompute', {
        enable: beat2time( 16.0 ) < automaton.time
      } );
      this.glCatPath.render( 'particlesCompute', {
        enable: beat2time( 16.0 ) < automaton.time
      } );
      this.glCatPath.render( 'trailsCompute', {
        enable: beat2time( 16.0 ) < automaton.time
      } );
      this.glCatPath.render( 'racerCompute', {
        enable: beat2time( 16.0 ) < automaton.time
      } );

      for ( let i = 0; i < 3; i ++ ) {
        this.glCatPath.render( 'logCompute', {
          enable: beat2time( 16.0 ) < automaton.time
        } );
      }
    }

    // == shadow ===================================================================================
    if ( isFirstView ) {
      this.glCatPath.render( 'shadow' );

      this.glCatPath.render( 'box', {
        enable: beat2time( 16.0 ) < automaton.time,
        target: this.glCatPath.fb( 'shadow' ),
        isShadow: true,
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso
      } );

      this.glCatPath.render( 'raymarch', {
        enable: beat2time( 16.0 ) < automaton.time,
        target: this.glCatPath.fb( 'shadow' ),
        isShadow: true,
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso
      } );

      this.glCatPath.render( 'trailsRender', {
        enable: beat2time( 16.0 ) < automaton.time,
        target: this.glCatPath.fb( 'shadow' ),
        isShadow: true,
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso
      } );

      this.glCatPath.render( 'particlesRender', {
        enable: beat2time( 16.0 ) < automaton.time,
        target: this.glCatPath.fb( 'shadow' ),
        isShadow: true,
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso
      } );

      this.glCatPath.render( 'veryPlane', {
        enable: beat2time( 16.0 ) < automaton.time,
        target: this.glCatPath.fb( 'shadow' ),
        isShadow: true,
        width: CONFIG.shadowReso,
        height: CONFIG.shadowReso
      } );
    }

    // == foreground ===============================================================================
    this.glCatPath.render( 'target', {
      width: width,
      height: height
    } );

    this.glCatPath.render( 'box', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'patternsRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'raymarch', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'circle', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      totalFrame: this.totalFrame,
      width: width,
      height: height
    } );

    this.glCatPath.render( 'particlesRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'racerRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'trailsRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    this.glCatPath.render( 'veryPlane', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    // == ui =======================================================================================
    this.glCatPath.render( 'ui', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height,
      analyserData: this.audio.getAnalyserData()
    } );

    this.glCatPath.render( 'logRender', {
      enable: beat2time( 16.0 ) < automaton.time,
      target: this.glCatPath.fb( 'target' ),
      width: width,
      height: height
    } );

    // == render ===================================================================================
    this.glCatPath.render( 'render', {
      enable: beat2time( 16.0 ) < automaton.time,
      inputs: this.glCatPath.fb( 'target' ).textures,
      shadow: this.glCatPath.fb( 'shadow' ).texture,
      width: width,
      height: height
    } );

    // == post =====================================================================================
    this.glCatPath.render( 'distance', {
      enable: beat2time( 16.0 ) < automaton.time,
      input: this.glCatPath.fb( 'target' ).textures[ 0 ],
      width: width,
      height: height
    } );

    this.glCatPath.render( 'dof', {
      enable: beat2time( 16.0 ) < automaton.time,
      dry: this.glCatPath.fb( 'render' ).texture,
      depth: this.glCatPath.fb( 'distance' ).texture,
      width: width,
      height: height
    } );

    // == post 2 ===================================================================================
    this.glCatPath.render( 'preBloom', {
      width: width / 4,
      height: height / 4,
      enable: beat2time( 16.0 ) < automaton.time,
      input: this.glCatPath.fb( 'dof' ).texture,
      bias: [ -0.9, -0.9, -0.9 ],
      factor: [ 1.0, 1.0, 1.0 ]
    } );
    this.glCatPath.render( 'bloom', {
      width: width / 4,
      height: height / 4,
      enable: beat2time( 16.0 ) < automaton.time
    } );
    this.glCatPath.render( 'postBloom', {
      width: width,
      height: height,
      enable: beat2time( 16.0 ) < automaton.time,
      dry: this.glCatPath.fb( 'dof' ).texture
    } );

    this.glCatPath.render( 'post', {
      width: width,
      height: height,
      enable: beat2time( 16.0 ) < automaton.time,
      input: this.glCatPath.fb( 'postBloom' ).texture
    } );

    if ( !this.isVR ) {
      this.glCatPath.render( 'fxaa', {
        width: width,
        height: height,
        enable: beat2time( 16.0 ) < automaton.time,
        input: this.glCatPath.fb( 'post' ).texture
      } );
    }

    const glitchInput = this.isVR ? this.glCatPath.fb( 'post' ).texture : this.glCatPath.fb( 'fxaa' ).texture;
    this.glCatPath.render( 'glitch', {
      width: width,
      height: height,
      enable: beat2time( 16.0 ) < automaton.time,
      input: (
        automaton.time < beat2time( 234.0 ) ? glitchInput :
        automaton.time < beat2time( 234.5 ) ? this.glCatPath.fb( 'render' ).texture :
        automaton.time < beat2time( 235.5 ) ? glitchInput :
        automaton.time < beat2time( 236.0 ) ? this.glCatPath.fb( 'distance' ).texture :
        automaton.time < beat2time( 237.5 ) ? glitchInput :
        automaton.time < beat2time( 238.0 ) ? this.glCatPath.fb( 'target' ).textures[ 0 ] :
        automaton.time < beat2time( 238.5 ) ? glitchInput :
        automaton.time < beat2time( 239.0 ) ? this.glCatPath.fb( 'target' ).textures[ 1 ] :
        glitchInput
      )
    } );

    this.glCatPath.render( 'return', {
      viewport: viewport,
      enable: beat2time( 16.0 ) < automaton.time,
      target: GLCatPath.nullFb,
      input: this.glCatPath.fb( 'glitch' ).texture
    } );

    // this.glCatPath.render( 'inspector', {
    //   target: GLCatPath.nullFb,
    //   input: this.glCatPath.fb( 'shadow' ).texture
    // } );
    this.glCatPath.render( 'tone', {
      viewport: viewport,
      enable: automaton.time < beat2time( 16.0 ),
      target: GLCatPath.nullFb
    } );

    // == haha =====================================================================================
    if ( isFirstView ) {
      if ( this.totalFrame % 60 === 0.0 ) {
        this.log.verb( `Frame: ${ this.totalFrame }` );
        this.log.verb( `Time: ${ automaton.time.toFixed( 3 ) } / Beat: ${ time2beat( automaton.time ).toFixed( 2 ) }` );
      }

      this.doAt( beat2time( 16.0 ), () => {
        this.log.drop();
        this.log.info( `Rendering resolution: ${this.width}x${this.height}` );
        this.log.info( `Audio buffer size: ${this.audio.bufferSize}` );
        this.log.info( '- - - - - - - - - - - - - - -' );
        this.log.info( '\u0003 \u0003 \u0003 Welcome to TDF2018 \u0003 \u0003 \u0003' );
        this.log.info( 'You are experiencing ...' );
        this.log.info( '' );
        this.log.color( [ 1.3, 2.4, 0.2 ] );
        this.log.print( 'FMS_Cat - Until' );
        this.log.color();
        this.log.print( ' (Run time: 2m30s)' );
      } );

      this.doAt( beat2time( 48.0 ), () => {
        this.log.info( 'This entire experience is made of a ' );
        this.log.color( [ 1.8, 0.1, 0.5 ] );
        this.log.print( '64KB HTML' );
        this.log.info( '(Incl. this cool MUSIC !!)' );
      } );

      this.doAt( beat2time( 80.0 ), () => {
        this.log.info( 'Trails activated' );
        this.log.info( '\u000E Do you like acid bass? \u000E' );
      } );

      this.doAt( beat2time( 144.0 ), () => {
        this.log.info( 'Entering a section called "ITS_BEGINNING"' );
        this.log.info( 'Tips: The this.log is implemented in...' );
        this.log.info( '29 Nov 2018 (3 days before the deadline)' );
        this.log.warn( `Now it's ${ new Date().toLocaleTimeString() }... End of party is approaching` );
      } );

      this.doAt( beat2time( 208.0 ), () => {
        this.log.info( 'Rings activated' );
      } );

      this.doAt( beat2time( 224.0 ), () => {
        this.log.info( '########################################' );
        this.log.info( '## BE PREPARED FOR FURTHER EXPERIENCE ##' );
        this.log.info( '########################################' );
        this.log.err( 'EXCESSIVE_EOM_RESOURCES_REUSE_DETECTED' );
        this.log.err( 'See for more details:' );
        this.log.err( 'http://fms-cat-eom.github.io/' );
        this.log.info( 'Preparing harder kickdrum... OK' );
        this.log.info( 'Preparing FM powered wobble bass... OK' );
        this.log.info( 'Initializing FTL translation sequence... OK' );
        this.log.info( 'Initializing anti-glitch calibrator... Failed' );
        this.log.warn( 'Global time might be modified in audio shader' );
        for ( let i = 0; i < 999; i ++ ) {
          this.log.warn( 'Random f#%ing number: ' + Math.random() );
        }
      } );

      this.doAt( beat2time( 240.0 ), () => {
        this.log.drop();
        this.log.info( 'FTL translation has successfully done' );
        this.log.info( 'Particles limit increased: 266,752' );
        this.log.info( 'IFS fractals activated [Raymarcher]' );
        this.log.warn( 'Otaku wa sugu IFS fractals' );
      } );

      this.doAt( beat2time( 300.0 ), () => {
        this.log.info( 'I\'m so proud of this 909Snare' );
      } );

      this.doAt( beat2time( 304.0 ), () => {
        this.log.info( 'Something weird activated' );
        this.log.info( 'Greetings, pals :' );
      } );
      [
        '0x4015',
        'Ctrl-Alt-Test',
        'fsqrt',
        'gam0022',
        'gaz',
        'gyabo',
        'Had2Apps',
        'Jugem-T',
        'notargs',
        'Radium Software',
        'RTX1911',
        'soma_arc',
        'System K',
        'toe on net',
      ].forEach( ( v, i ) => {
        this.doAt( beat2time( 306.0 + 2.0 * i ), () => {
          this.log.info( `\u0002 Hi, ${v} !!` );
        } );
      } );

      this.doAt( beat2time( 336.0 ), () => {
        this.log.info( 'Also I really want to shoutout to :' );
      } );
      [
        'NotITG Community (esp. Frums and Taro)',
        'Live Coding & VJ Community',
        'of course, TDF Community',
      ].forEach( ( v, i ) => {
        this.doAt( beat2time( 338.0 + 2.0 * i ), () => {
          this.log.info( `\u0003 I love you, ${v} !!` );
        } );
      } );

      this.doAt( beat2time( 368.0 ), () => {
        this.log.info( 'I made this prod within 1 weeks, forgive me' );
        this.log.info( '== Here is the end of this demo ==' );
        this.log.info( '==   Thanks all, I love you \u0003   ==' );
      } );
    }

    // == end ======================================================================================
    if ( isLastView ) {
      this.glCatPath.end();
    }

    // == finalize the loop ========================================================================
    if ( isLastView ) {
      this.isInitialFrame = false;
      this.totalFrame ++;
    }
  }

  textureRandomUpdate( _tex, _size ) {
    this.glCat.setTextureFromArray( _tex, _size, _size, ( () => {
      let len = _size * _size * 4;
      let ret = new Uint8Array( len );
      for ( let i = 0; i < len; i ++ ) {
        ret[ i ] = Math.floor( this.xorshift.gen() * 256.0 );
      }
      return ret;
    } )() );
  }

  // == jikan ga nai ===============================================================================
  doAt( t, func ) {
    if (
      this.automaton.time - this.automaton.deltaTime < t &&
      t < this.automaton.time
    ) {
      func();
    }
  }
}
