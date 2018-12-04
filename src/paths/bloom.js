import * as UltraCat from '../libs/ultracat';

// ------

export default ( context ) => {
  const glCatPath = context.glCatPath;
  const glCat = glCatPath.glCat;
  const gl = glCat.gl;

  const width = context.width;
  const height = context.height;

  // ------

  const vboQuad = glCat.createVertexbuffer( new Float32Array( UltraCat.triangleStripQuad ) );

  // ------

  glCatPath.add( {
    preBloom: {
      width: width / 4,
      height: height / 4,
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
      width: width / 4,
      height: height / 4,
      vert: require( '../shaders/quad.vert' ),
      frag: require( '../shaders/gauss.frag' ),
      blend: [ gl.ONE, gl.ONE ],
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
      framebuffer: true,
      float: true,
      tempFb: glCat.createFloatFramebuffer( width / 4, height / 4 ),
      func: ( path, params ) => {
        glCat.attribute( 'p', vboQuad, 2 );

        for ( let i = 0; i < 3; i ++ ) {
          let gaussVar = [ 0.003, 0.01, 0.05 ][ i ] * height;
          glCat.uniform1f( 'var', gaussVar );

          gl.bindFramebuffer( gl.FRAMEBUFFER, path.tempFb.framebuffer );
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
          glCat.uniformTexture( 'sampler0', path.tempFb.texture, 0 );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      }
    },

    postBloom: {
      width: width,
      height: height,
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