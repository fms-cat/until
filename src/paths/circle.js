import { Xorshift } from '../libs/xorshift.js';
import * as UltraCat from '../libs/ultracat';
import MathCat from '../libs/mathcat.js';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const circle = require( '../geoms/circle.js' )( {
    radius: 1.0,
    hole: 0.8
  } );
  const vboPos = glCat.createVertexbuffer( circle.position );
  const vboUv = glCat.createVertexbuffer( circle.uv );
  const vboNor = glCat.createVertexbuffer( circle.normal );
  const vboMatrix = glCat.createVertexbuffer(
    new Float32Array( UltraCat.matrix1d( 30 ) )
  );
  const ibo = glCat.createIndexbuffer( circle.index );

  // == path definition begin ==================================================
  glCatPath.add( {
    circle: {
      vert: require( '../shaders/circle.vert' ),
      frag: require( '../shaders/circle.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      cull: false,
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboPos, 3 );
        glCat.attribute( 'aUv', vboUv, 2 );
        glCat.attribute( 'aNor', vboNor, 3 );
        glCat.attributeDivisor( 'aMatrix', vboMatrix, 1, 1 );

        glCat.uniform1i( 'isShadow', params.isShadow );
        glCat.uniform1f( 'availZ', auto( 'circle-availZ' ) );
        glCat.uniform3fv( 'color', [ 1.0, 0.1, 0.3 ] );

        let ext = glCat.getExtension( 'ANGLE_instanced_arrays' );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ibo );
        ext.drawElementsInstancedANGLE( gl.TRIANGLES, circle.index.length, gl.UNSIGNED_SHORT, 0, 30 );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/circle.vert',
        '../shaders/circle.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'circle',
          require( '../shaders/circle.vert' ),
          require( '../shaders/circle.frag' )
        );
      }
    );
  }
};