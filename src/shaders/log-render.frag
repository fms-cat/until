#extension GL_EXT_draw_buffers : require

varying vec4 vPos;
varying vec3 vCol;
varying vec2 vUv;
varying float vSize;

uniform bool isShadow;

uniform sampler2D samplerSprite;

// == main procedure ===========================================================
void main() {
  if ( vSize == 0.0 ) { discard; }

  vec2 uv = ( gl_PointCoord + vUv ) / 16.0;
  float tex = texture2D( samplerSprite, uv ).x;
  if ( tex < 0.5 ) { discard; }

  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos.xyz - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  gl_FragData[ 0 ] = vec4( vPos.xyz, 1.0 );
  gl_FragData[ 1 ] = vec4( 0.0, 0.0, 1.0, 1.0 );
  gl_FragData[ 2 ] = vec4( vCol, 2.0 );
}