#extension GL_EXT_draw_buffers : require

// == varyings =================================================================
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNor;
varying float vScale;
varying float vPattern;

// == uniforms =================================================================
uniform bool isShadow;
uniform float availZ;

// == main =====================================================================
void main() {
  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  if (
    vPos.z < availZ ||
    inRange( availZ + 0.5, availZ + 1.0, vPos.z )
  ) { discard; }

  // this bool means visibility
  bool b = false;

  vec2 uv = vUv;

  if ( vPattern < 0.5 ) {
    vec2 uv = abs( uv - 0.5 );
    b = (
      ( uv.x < 0.15 / vScale ) ? (
        ( uv.y - 0.45 < 0.03 / vScale ) &&
        !( ( uv.y - 0.45 ) - ( uv.x - 0.025 / vScale ) * sqrt( 3.0 ) < 0.0 )
      ) : abs( length( uv ) - 0.45 ) < 0.01 / vScale
    );
  } else if ( vPattern < 1.5 ) {
    vec2 uv = uv - 0.5;
    b = (
      abs( fract( atan( uv.y, uv.x ) * 40.0 / PI ) - 0.5 ) < 0.2 / vScale / length( uv ) &&
      abs( length( uv ) - 0.45 ) < 0.05 / vScale
    );
  } else if ( vPattern < 2.5 ) {
    vec2 uv = abs( uv - 0.5 );
    b = (
      abs( length( uv ) - 0.45 ) < 0.04 / vScale &&
      0.1 / vScale < min( uv.x, uv.y ) ||
      abs( length( uv ) - 0.47 ) < 0.01 / vScale
    );
  }

  if ( !b ) { discard; }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( 2.0, 0.0, 0.0, 4.0 );
}