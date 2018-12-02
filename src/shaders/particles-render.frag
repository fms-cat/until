#extension GL_EXT_draw_buffers : require

varying vec3 vPos;
varying vec3 vCol;
varying float vLife;

uniform bool isShadow;

uniform sampler2D samplerShadow;

// == main procedure ===========================================================
void main() {
  if ( vLife <= 0.0 ) { discard; }

  if ( 0.5 < length( gl_PointCoord - 0.5 ) ) { discard; }

  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( 0.0, 0.0, 1.0, 1.0 );
  gl_FragData[ 2 ] = vec4( 0.8, 0.9, 2.0, 4.0 );
}