import MathCat from '../libs/mathcat';
import * as UltraCat from '../libs/ultracat';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const vboPos = glCat.createVertexbuffer( new Float32Array( [
    -4.5,  2.5,  0.0, -3.5,  1.5,  0.0,
    +4.5,  2.5,  0.0,  3.5,  1.5,  0.0,
    +4.5, -2.5,  0.0,  3.5, -1.5,  0.0,
    -4.5, -2.5,  0.0, -3.5, -1.5,  0.0,
    -4.5,  2.5,  0.0, -3.5,  1.5,  0.0
  ] ) );
  const vboNor = glCat.createVertexbuffer( new Float32Array( [
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0
  ] ) );

  // == hi texture =============================================================
  const textureLv = glCat.createTexture();

  // == path definition begin ==================================================
  glCatPath.add( {
    ui: {
      vert: require( '../shaders/ui.vert' ),
      frag: require( '../shaders/ui.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      depthTest: false,
      depthWrite: false,
      func: ( path, params ) => {
        glCat.attribute( 'aPos', vboPos, 3 );
        glCat.attribute( 'aNor', vboNor, 3 );

        glCat.uniform1i( 'isShadow', params.isShadow );
        glCat.uniform4fv( 'color', [ 0.2, 0.3, 0.4, 3.0 ] );

        glCat.setTextureFromFloatArray( textureLv, 2048, 1, params.analyserData, gl.LUMINANCE );
        glCat.uniformTexture( 'samplerLv', textureLv, 0 );

        let matM = MathCat.mat4Identity();
        glCat.uniformMatrix4fv( 'matM', matM );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 10 );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/ui.vert',
        '../shaders/ui.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'ui',
          require( '../shaders/ui.vert' ),
          require( '../shaders/ui.frag' )
        );
      }
    );
  }
};