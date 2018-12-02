// == load some modules ========================================================
import { Xorshift } from '../libs/xorshift';
import * as UltraCat from '../libs/ultracat';

// == roll the dice ============================================================
const seed = 15881342356;
let xorshift = new Xorshift( seed );

// == very basic constants =====================================================
const ppp = 2;
const trailLength = 64;
const trails = 256;

export default ( context ) => {
  // == prepare context ========================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == prepare vbos ===========================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  const vboComputeUV = glCat.createVertexbuffer( new Float32Array(
    UltraCat.matrix2d( trailLength, trails ).map( ( v, i ) => (
      i % 2 === 0
        ? ( v * ppp + 0.5 ) / trailLength / ppp
        : ( v + 0.5 ) / trails
    ) )
  ) );

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == let's create paths =====================================================
  glCatPath.add( {
    // == compute trails =======================================================
    racerCompute: {
      width: trailLength * ppp,
      height: trails,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/racer-compute.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      swapbuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );

        glCat.uniform1f( 'trails', trails );
        glCat.uniform1f( 'trailLength', trailLength );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniformTexture( 'samplerPcompute', path.swapbuffer.texture, 0 );

        glCat.uniform1f( 'genRate', auto( 'racer-genRate' ) );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // render trails ===========================================================
    racerRender: {
      vert: require( '../shaders/racer-render.vert' ),
      frag: require( '../shaders/racer-render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aComputeUV', vboComputeUV, 2 );

        glCat.uniform1f( 'trails', trails );
        glCat.uniform1f( 'trailLength', trailLength );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform2fv( 'resolutionPcompute', [ trailLength * ppp, trails ] );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'racerCompute' ).texture, 0 );
        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 1 );

        gl.drawArrays( gl.POINTS, 0, trailLength * trails );
      }
    },
  } );

  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/racer-compute.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'racerCompute',
          require( '../shaders/quad.vert' ),
          require( '../shaders/racer-compute.frag' )
        );
      }
    );

    module.hot.accept(
      [
        '../shaders/racer-render.vert',
        '../shaders/racer-render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'racerRender',
          require( '../shaders/racer-render.vert' ),
          require( '../shaders/racer-render.frag' )
        );
      }
    );
  }
};