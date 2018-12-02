import * as UltraCat from '../libs/ultracat';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const width = context.width;
  const height = context.height;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    raymarch: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/raymarch.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      drawbuffers: 3,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );

        glCat.uniform1i( 'isShadow', params.isShadow ? 1 : 0 );
        glCat.uniform4fv( 'ifsParams', [
          auto( 'raymarch-ifsParamsX' ),
          auto( 'raymarch-ifsParamsY' ),
          auto( 'raymarch-ifsParamsZ' ),
          auto( 'raymarch-ifsParamsW' )
        ] );

        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/raymarch.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'raymarch',
          require( '../shaders/quad.vert' ),
          require( '../shaders/raymarch.frag' )
        );
      }
    );
  }
};