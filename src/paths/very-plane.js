import MathCat from '../libs/mathcat';
import * as UltraCat from '../libs/ultracat';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const vboPos = glCat.createVertexbuffer( new Float32Array(
    UltraCat.triangleStripQuad3
  ) );
  const vboNor = glCat.createVertexbuffer( new Float32Array(
    UltraCat.triangleStripQuadNor
  ) );
  const vboUv = glCat.createVertexbuffer( new Float32Array(
    UltraCat.triangleStripQuadUV
  ) );

  const matrix = UltraCat.matrix2d( 75, 75 ).map( ( v, i ) => (
    v * 0.4 - 14.8
  ) );
  const vboMatrix = glCat.createVertexbuffer( new Float32Array( matrix ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    veryPlane: {
      vert: require( '../shaders/very-plane.vert' ),
      frag: require( '../shaders/very-plane.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      cull: false,
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboPos, 3 );
        glCat.attribute( 'aNor', vboNor, 3 );
        glCat.attributeDivisor( 'aMatrix', vboMatrix, 2, 1 );

        glCat.uniform1i( 'isShadow', params.isShadow );
        glCat.uniform1f( 'flipThreshold', auto( 'veryPlane-flipThreshold' ) );
        glCat.uniform4fv( 'color', [ 0.2, 0.3, 0.4, 3.0 ] );

        let matM = MathCat.mat4Apply(
          MathCat.mat4Translate( [ 0.0, -5.0, 0.0 ] ),
          MathCat.mat4RotateX( Math.PI / 2.0 ),
          MathCat.mat4Identity()
        );
        glCat.uniformMatrix4fv( 'matM', matM );

        let ext = glCat.getExtension( 'ANGLE_instanced_arrays' );
        ext.drawArraysInstancedANGLE( gl.TRIANGLE_STRIP, 0, 4, matrix.length / 2 );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/very-plane.vert',
        '../shaders/very-plane.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'veryPlane',
          require( '../shaders/very-plane.vert' ),
          require( '../shaders/very-plane.frag' )
        );
      }
    );
  }
};