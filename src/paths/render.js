import * as UltraCat from '../libs/ultracat.js';

export default ( context ) => {
  // == hi context =============================================================
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  // == hi vbo =================================================================
  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // == path definition begin ==================================================
  glCatPath.add( {
    render: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/render.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniformTexture( 'sampler0', params.inputs[ 0 ], 0 );
        glCat.uniformTexture( 'sampler1', params.inputs[ 1 ], 1 );
        glCat.uniformTexture( 'sampler2', params.inputs[ 2 ], 2 );
        glCat.uniformTexture( 'samplerShadow', params.shadow, 3 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    }
  } );

  // == hot reload stuff =======================================================
  if ( module.hot ) {
    module.hot.accept(
      [
        '../shaders/quad.vert',
        '../shaders/render.frag'
      ],
      () => {
        glCatPath.replaceProgram(
          'render',
          require( '../shaders/quad.vert' ),
          require( '../shaders/render.frag' )
        );
      }
    );
  }
};