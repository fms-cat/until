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
    dof: {
      width: width,
      height: height,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/dof.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniform1f( 'bokehAmp', auto( 'dof-amp' ) );
        glCat.uniform1f( 'bokehFocus', auto( 'dof-focus' ) );
        glCat.uniformTexture( 'samplerDry', params.dry, 0 );
        glCat.uniformTexture( 'samplerDepth', params.depth, 1 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/dof.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'dof',
          require( '../shaders/quad.vert' ),
          require( '../shaders/dof.frag' )
        );
      }
    );
  }
};