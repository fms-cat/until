#extension GL_EXT_draw_buffers : require

varying vec3 vPos;
varying vec3 vNor;
varying vec3 vCol;
varying float vLife;
varying float vIsOkayToDraw;

uniform bool isShadow;

void main() {
  if ( vIsOkayToDraw < 0.5 ) { discard; }
  if ( vLife <= 0.0 ) { discard; }

  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  vec3 col = 4.0 * vCol;

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( col, 1.0 );
}