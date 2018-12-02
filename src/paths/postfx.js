import * as UltraCat from '../libs/ultracat';

// ------

export default ( context ) => {
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const width = context.width;
  const height = context.height;

  const auto = context.automaton.auto;

  // ------

  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // ------

  glCatPath.add( {
    post: {
      width: width,
      height: height,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/post.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniform1f( 'barrelAmp', auto( 'post-barrelAmp' ) );
        glCat.uniform1f( 'barrelOffset', auto( 'post-barrelOffset' ) );
        glCat.uniformTexture( 'sampler0', params.input, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    glitch: {
      width: width,
      height: height,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/glitch.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniform1f( 'amp', auto( 'glitch-amp' ) );
        glCat.uniform1f( 'fadeout', auto( 'glitch-fadeout' ) );
        glCat.uniformTexture( 'sampler0', params.input, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    fxaa: {
      width: width,
      height: height,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/fxaa.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniformTexture( 'sampler0', params.input, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },
  } );
};