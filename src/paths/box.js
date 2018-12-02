import MathCat from '../libs/mathcat';
import * as UltraCat from '../libs/ultracat';
import genCube from '../geoms/cube';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const box = genCube();
  const vboBoxPos = glCat.createVertexbuffer( new Float32Array( box.position ) );
  const vboBoxNor = glCat.createVertexbuffer( new Float32Array( box.normal ) );
  const iboBox = glCat.createIndexbuffer( new Int16Array( box.index ) );

  const matrix = UltraCat.matrix2d( 11, 11 ).map( ( v, i ) => (
    v / 5.0 - 1.0
  ) );
  const vboMatrix = glCat.createVertexbuffer( new Float32Array( matrix ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    box: {
      vert: require( '../shaders/box.vert' ),
      frag: require( '../shaders/box.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboBoxPos, 3 );
        glCat.attribute( 'aNor', vboBoxNor, 3 );
        glCat.attributeDivisor( 'aMatrix', vboMatrix, 2, 1 );

        glCat.uniform1i( 'isShadow', params.isShadow );

        glCat.uniform1f( 'size', auto( 'box-size' ) );
        glCat.uniform1f( 'posOffset', auto( 'box-posOffset' ) );
        glCat.uniform1f( 'spinOffset', auto( 'box-spinOffset' ) );

        let matM = MathCat.mat4Identity();
        glCat.uniformMatrix4fv( 'matM', matM );

        let ext = glCat.getExtension( 'ANGLE_instanced_arrays' );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iboBox );
        ext.drawElementsInstancedANGLE( gl.TRIANGLES, box.index.length, gl.UNSIGNED_SHORT, 0, matrix.length / 2 );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/box.vert',
        '../shaders/box.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'box',
          require( '../shaders/box.vert' ),
          require( '../shaders/box.frag' )
        );
      }
    );
  }
};