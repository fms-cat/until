// == shit =====================================================================
#extension GL_EXT_draw_buffers : require

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vNor;
varying float vFlip;

// == uniforms =================================================================
uniform bool isShadow;

// == main =====================================================================
void main() {
  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  vec4 col = vec4( mix(
    vec3( 0.2, 0.3, 0.4 ),
    vec3( 0.7, 1.8, 1.2 ),
    sin( vFlip )
  ), 1.0 );

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = col;
}