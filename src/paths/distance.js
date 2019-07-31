import * as UltraCat from '../libs/ultracat';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  // == hi vbo =================================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    distance: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/distance.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniformTexture( 'sampler0', params.input, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );
};