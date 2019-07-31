import * as UltraCat from '../libs/ultracat';

// ------

export default ( context ) => {
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  // ------

  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // ------

  glCatPath.add( {
    preBloom: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/bloom-pre.frag' ),
      blend: [ gl.ONE, gl.ONE ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniform3fv( 'bias', params.bias );
        glCat.uniform3fv( 'factor', params.factor );
        glCat.uniformTexture( 'sampler0', params.input, 0 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },

    bloom: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/gauss.frag' ),
      blend: [ gl.ONE, gl.ONE ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      swapbuffer: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );

        for ( let i = 0; i < 3; i ++ ) {
          let gaussVar = [ 3, 10, 50 ][ i ];
          glCat.uniform1f( 'var', gaussVar );

          gl.bindFramebuffer( gl.FRAMEBUFFER, path.swapbuffer.framebuffer );
          glCat.clear( ...path.clear );
          glCat.uniform1i( 'isVert', false );
          glCat.uniformTexture(
            'sampler0',
            i === 0 ? glCatPath.fb( 'preBloom' ).texture : path.framebuffer.texture,
            0
          );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

          gl.bindFramebuffer( gl.FRAMEBUFFER, params.framebuffer );
          glCat.uniform1i( 'isVert', true );
          glCat.uniformTexture( 'sampler0', path.swapbuffer.texture, 0 );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      }
    },

    postBloom: {
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/bloom-post.frag' ),
      blend: [ gl.ONE, gl.ZERO ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );
        glCat.uniformTexture( 'samplerDry', params.dry, 0 );
        glCat.uniformTexture( 'samplerWet', glCatPath.fb( 'bloom' ).texture, 1 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
      }
    },
  } );
};