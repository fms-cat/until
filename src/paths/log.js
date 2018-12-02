// == load some modules ========================================================
import * as UltraCat from '../libs/ultracat';

// == very basic constants =====================================================
const ppp = 2;
const nParticleSqrt = 32;
const nParticle = nParticleSqrt * nParticleSqrt;

// == log ======================================================================
let logIndex = 0;
let logBuffer = [];
let LOG_RETURN = 114514;

const log = {};
let logDrop = false;
let logPosition = [ 0.0, 0.0, 0.0 ];
let logColor = [ 0.7, 0.8, 1.1 ];

log.line = () => {
  logBuffer.push( LOG_RETURN );
  logPosition[ 0 ] = 0.0;
};

log.print = ( mes ) => {
  for ( let i = 0; i < mes.length; i ++ ) {
    logBuffer.push( [
      logPosition.concat(),
      logColor.concat( [ mes.charCodeAt( i ) ] )
    ] );
    logPosition[ 0 ] += 0.1;
  }
};

log.code = ( code ) => {
  logBuffer.push( [
    logPosition.concat(),
    logColor.concat( [ code ] )
  ] );
  logPosition[ 0 ] += 0.1;
};

log.pos = ( pos ) => {
  logPosition = pos || [ 0.0, 0.0, 0.0 ];
};

log.color = ( col ) => {
  logColor = col || [ 1.0, 1.2, 2.0 ];
};

log.err = ( mes ) => {
  log.line();
  log.color( [ 1.7, 0.2, 0.5 ] );
  log.print( '[ERR!] ' );
  log.color();
  log.print( mes );
};

log.warn = ( mes ) => {
  log.line();
  log.color( [ 1.3, 0.8, 0.2 ] );
  log.print( '[WARN] ' );
  log.color();
  log.print( mes );
};

log.info = ( mes ) => {
  log.line();
  log.color( [ 0.2, 1.5, 0.9 ] );
  log.print( '[INFO] ' );
  log.color();
  log.print( mes );
};

log.verb = ( mes ) => {
  log.line();
  log.color( [ 0.5, 0.1, 1.0 ] );
  log.print( '[VERB] ' );
  log.color( [ 0.6, 0.6, 0.6 ] );
  log.print( mes );
};

log.drop = () => {
  logBuffer.splice( 0 );
  logDrop = true;
};

export default ( context ) => {
  // == prepare context ========================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == prepare vbos ===========================================================
  const vboQuad = glCat.createVertexbuffer(
    new Float32Array( UltraCat.triangleStripQuad )
  );

  const vboComputeUV = glCat.createVertexbuffer( new Float32Array(
    UltraCat.matrix2d( nParticleSqrt, nParticleSqrt ).map( ( v, i ) => (
      i % 2 === 0
        ? ( v * ppp + 0.5 ) / nParticleSqrt / ppp
        : ( v + 0.5 ) / nParticleSqrt
    ) )
  ) );

  // == prepare sprite sheet ===================================================
  const textureSprite = glCat.createTexture();
  {
    const imageSprite = new Image();
    imageSprite.onload = () => {
      glCat.setTexture( textureSprite, imageSprite );
      glCat.textureFilter( textureSprite, gl.NEAREST );
    };
    imageSprite.src = require( '../images/char5x5.png' );
  }

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == let's create paths =====================================================
  glCatPath.add( {
    // == compute particles =====================================================
    logCompute: {
      width: nParticleSqrt * ppp,
      height: nParticleSqrt,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/log-compute.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      swapbuffer: true,
      float: true,
      func: ( path, params ) => {
        // == a ================================================================
        glCat.uniform1i( 'logReturn', false );
        if ( 0 < logBuffer.length ) {
          const buf = logBuffer.shift();
          if ( buf === LOG_RETURN ) {
            glCat.uniform1i( 'logReturn', true );
          } else {
            buf[ 0 ][ 3 ] = logIndex;
            glCat.uniform4fv( 'logPos', buf[ 0 ] );
            glCat.uniform4fv( 'logCol', buf[ 1 ] );
            logIndex = ( logIndex + 1 ) % nParticle;
          }
        } else {
          glCat.uniform4fv( 'logPos', [ 0.0, 0.0, 0.0, -1.0 ] );
        }
        glCat.uniform1i( 'logDrop', logDrop );
        logDrop = false;

        // == render ===========================================================
        glCat.attribute( 'p', vboQuad, 2 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform3fv( 'logOffset', [
          auto( 'log-offsetX' ),
          auto( 'log-offsetY' ),
          auto( 'log-offsetZ' )
        ] );
        glCat.uniformTexture( 'samplerPcompute', path.swapbuffer.texture, 0 );

        glCat.uniform1f( 'noisePhase', auto( 'particles-noisePhase' ) );
        glCat.uniform1f( 'genRate', auto( 'particles-genRate' ) );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // == render logs ==========================================================
    logRender: {
      vert: require( '../shaders/log-render.vert' ),
      frag: require( '../shaders/log-render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      depthTest: false,
      depthWrite: false,
      func: ( path, params ) => {
        glCat.attribute( 'computeUV', vboComputeUV, 2 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform2fv( 'resolutionPcompute', [ nParticleSqrt * ppp, nParticleSqrt ] );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'logCompute' ).texture, 0 );
        glCat.uniformTexture( 'samplerSprite', textureSprite, 1 );
        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 2 );

        gl.drawArrays( gl.POINTS, 0, nParticle );
      }
    },
  } );

  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/log-compute.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'logCompute',
          require( '../shaders/quad.vert' ),
          require( '../shaders/log-compute.frag' )
        );
      }
    );

    module.hot.accept(
      [
        '../shaders/log-render.vert',
        '../shaders/log-render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'logRender',
          require( '../shaders/log-render.vert' ),
          require( '../shaders/log-render.frag' )
        );
      }
    );
  }

  return log;
};