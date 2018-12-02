// == load some modules ========================================================
import { Xorshift } from '../libs/xorshift';
import * as UltraCat from '../libs/ultracat';

// == roll the dice ============================================================
const seed = 15881342356;
let xorshift = new Xorshift( seed );

// == very basic constants =====================================================
const ppp = 1;
const nParticleSqrt = 8;
const nParticle = nParticleSqrt * nParticleSqrt;

export default ( context ) => {
  // == prepare context ========================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == prepare vbos ===========================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  const vboPos = glCat.createVertexbuffer( new Float32Array(
    UltraCat.triangleStripQuad3
  ) );

  const vboComputeUV = glCat.createVertexbuffer( new Float32Array(
    UltraCat.matrix2d( nParticleSqrt, nParticleSqrt ).map( ( v, i ) => (
      i % 2 === 0
        ? ( v * ppp + 0.5 ) / nParticleSqrt / ppp
        : ( v + 0.5 ) / nParticleSqrt
    ) )
  ) );

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == let's create paths =====================================================
  glCatPath.add( {
    // == compute particles =======================================================
    patternsCompute: {
      width: nParticleSqrt * ppp,
      height: nParticleSqrt,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/patterns-compute.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      swapbuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniformTexture( 'samplerPcompute', path.swapbuffer.texture, 0 );

        glCat.uniform1f( 'noisePhase', auto( 'patterns-noisePhase' ) );
        glCat.uniform1f( 'genRate', auto( 'patterns-genRate' ) );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // == render particles =====================================================
    patternsRender: {
      vert: require( '../shaders/patterns-render.vert' ),
      frag: require( '../shaders/patterns-render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboPos, 3 );
        glCat.attributeDivisor( 'aComputeUV', vboComputeUV, 2, 1 );

        glCat.uniform1f( 'nParticle', nParticle );
        glCat.uniform1f( 'nParticleSqrt', nParticleSqrt );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform2fv( 'resolutionPcompute', [ nParticleSqrt * ppp, nParticleSqrt ] );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'patternsCompute' ).texture, 0 );
        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 1 );

        const ext = glCat.getExtension( 'ANGLE_instanced_arrays' );
        ext.drawArraysInstancedANGLE( gl.TRIANGLE_STRIP, 0, 4, nParticle );
      }
    },
  } );

  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/patterns-compute.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'patternsCompute',
          require( '../shaders/quad.vert' ),
          require( '../shaders/patterns-compute.frag' )
        );
      }
    );

    module.hot.accept(
      [
        '../shaders/patterns-render.vert',
        '../shaders/patterns-render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'patternsRender',
          require( '../shaders/patterns-render.vert' ),
          require( '../shaders/patterns-render.frag' )
        );
      }
    );
  }
};