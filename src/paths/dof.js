import * as UltraCat from '../libs/ultracat';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const auto = context.automaton.auto;

  // == hi vbo =================================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    dof: {
      vert: require( '../shaders/quad.vert' ),
      frag: context.isVR ? require( '../shaders/dof-vr.frag' ) : require( '../shaders/dof.frag' ),
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
        '../shaders/dof.frag',
        '../shaders/dof-vr.frag',
      ],
      () => {
        glCatPath.replaceProgram(
          'dof',
          require( '../shaders/quad.vert' ),
          context.isVR ? require( '../shaders/dof-vr.frag' ) : require( '../shaders/dof.frag' )
        );
      }
    );
  }
};