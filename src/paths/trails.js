// == load some modules ========================================================
import { Xorshift } from '../libs/xorshift';
import * as UltraCat from '../libs/ultracat';

// == roll the dice ============================================================
const seed = 15881342356;
let xorshift = new Xorshift( seed );

// == very basic constants =====================================================
const ppp = 2;
const trailLength = 8;
const trails = 4096;

export default ( context ) => {
  // == prepare context ========================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == prepare vbos ===========================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  const vboComputeU = glCat.createVertexbuffer( ( () => {
    let ret = new Float32Array( 3 * trailLength );
    for ( let i = 0; i < trailLength; i ++ ) {
      const u = ( i * ppp + 0.5 ) / ( trailLength * ppp );
      ret[ i * 3 + 0 ] = u;
      ret[ i * 3 + 1 ] = u;
      ret[ i * 3 + 2 ] = u;
    }
    return ret;
  } )() );

  const vboTriIndex = glCat.createVertexbuffer( ( () => {
    let ret = new Float32Array( 3 * trailLength );
    for ( let i = 0; i < trailLength; i ++ ) {
      ret[ i * 3 + 0 ] = 0;
      ret[ i * 3 + 1 ] = 1;
      ret[ i * 3 + 2 ] = 2;
    }
    return ret;
  } )() );

  const ibo = glCat.createIndexbuffer( ( () => {
    let ret = new Uint16Array( 18 * ( trailLength - 1 ) );
    for ( let i = 0; i < trailLength - 1; i ++ ) {
      for ( let j = 0; j < 3; j ++ ) {
        const jn = ( j + 1 ) % 3;
        ret[ 18 * i + 6 * j + 0 ] = i * 3 + j;
        ret[ 18 * i + 6 * j + 1 ] = i * 3 + 3 + j;
        ret[ 18 * i + 6 * j + 2 ] = i * 3 + 3 + jn;
        ret[ 18 * i + 6 * j + 3 ] = i * 3 + j;
        ret[ 18 * i + 6 * j + 4 ] = i * 3 + 3 + jn;
        ret[ 18 * i + 6 * j + 5 ] = i * 3 + jn;
      }
    }
    return ret;
  } )() );

  const vboComputeV = glCat.createVertexbuffer( ( () => {
    let ret = new Float32Array( trails );
    for ( let i = 0; i < trails; i ++ ) {
      ret[ i ] = ( i + 0.5 ) / trails;
    }
    return ret;
  } )() );

  // == Toby Fox - Dummy! ======================================================
  const textureDummy = glCat.createTexture();
  glCat.setTextureFromArray( textureDummy, 1, 1, new Uint8Array( [ 0, 0, 0, 0 ] ) );

  // == let's create paths =====================================================
  glCatPath.add( {
    // == compute trails =======================================================
    trailsCompute: {
      width: trailLength * ppp,
      height: trails,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/trails-compute.frag' ),
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

        glCat.uniform1f( 'genRate', auto( 'trails-genRate' ) );
        glCat.uniform1f( 'noiseScale', auto( 'trails-noiseScale' ) );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    // render trails ===========================================================
    trailsRender: {
      vert: require( '../shaders/trails-render.vert' ),
      frag: require( '../shaders/trails-render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'computeU', vboComputeU, 1 );
        glCat.attribute( 'triIndex', vboTriIndex, 1 );
        glCat.attributeDivisor( 'computeV', vboComputeV, 1, 1 );

        glCat.uniform1f( 'trails', trails );
        glCat.uniform1f( 'trailLength', trailLength );
        glCat.uniform1f( 'ppp', ppp );

        glCat.uniform2fv( 'resolutionPcompute', [ trailLength * ppp, trails ] );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );

        glCat.uniformTexture( 'samplerPcompute', glCatPath.fb( 'trailsCompute' ).texture, 0 );
        glCat.uniformTexture( 'samplerShadow', params.textureShadow || textureDummy, 1 );

        let ext = glCat.getExtension( 'ANGLE_instanced_arrays' );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ibo );
        ext.drawElementsInstancedANGLE( gl.TRIANGLES, 18 * ( trailLength - 1 ), gl.UNSIGNED_SHORT, 0, trails );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
      }
    },
  } );

  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/trails-compute.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'trailsCompute',
          require( '../shaders/quad.vert' ),
          require( '../shaders/trails-compute.frag' )
        );
      }
    );

    module.hot.accept(
      [
        '../shaders/trails-render.vert',
        '../shaders/trails-render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'trailsRender',
          require( '../shaders/trails-render.vert' ),
          require( '../shaders/trails-render.frag' )
        );
      }
    );
  }
};