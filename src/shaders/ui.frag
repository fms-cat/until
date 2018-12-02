// == shit =====================================================================
#extension GL_EXT_draw_buffers : require

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vRawPos;
varying vec3 vNor;

// == uniforms =================================================================
uniform bool isShadow;

uniform vec4 color;

uniform sampler2D samplerLv;

// == main =====================================================================
void main() {
  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  calcRhythms();

  bool b = 4.47 < abs( vRawPos.x ) || 2.47 < abs( vRawPos.y );

  vec2 circ = vRawPos.xy - vec2( 3.8, -2.1 );
  circ = rotate2D( zOffset.x ) * circ;
  b = b || (
    length( circ ) < 0.25 &&
    0.2 < length( circ ) &&
    0.03 < abs( circ.y )
  ) || length( circ ) < 0.15;

  vec4 rectLv = vec4( 3.5, -1.7, 4.1, 2.4 );

  float lvuv = 0.01 + 0.4 * linearstep( rectLv.y, rectLv.w, lofi( vRawPos.y, 0.1 ) );
  float lv = 0.1 + 0.9 * linearstep( -90.0, -30.0, texture2D( samplerLv, vec2( lvuv, 0.5 ) ).x );
  b = b || (
    inRange( rectLv.y, rectLv.w, vRawPos.y ) &&
    inRange( mix( rectLv.z, rectLv.x, lv ), rectLv.z, vRawPos.x ) &&
    abs( mod( vRawPos.y, 0.1 ) - 0.05 ) < 0.03
  );

  b = b || (
    abs( abs( vRawPos.x ) - 4.3 ) < 0.1 &&
    abs( vRawPos.y ) < 2.4 &&
    mod( vRawPos.x + vRawPos.y + 0.4 * sign( vRawPos.x ) * time, 0.2 ) < 0.15
  );

  vec2 vRawPosYAbs = vec2( vRawPos.x, abs( vRawPos.y ) );

  b = b || (
    length( vRawPosYAbs.xy - vec2( 0.0, 2.3 ) ) < 0.05 * smoothstep( 0.2, 0.0, clavTime )
  );

  b = b || (
    length( vRawPosYAbs.xy - vec2( -0.2, 2.3 ) ) < 0.05 * smoothstep( 0.2, 0.0, rimshotTime.x )
  );

  b = b || (
    length( vRawPosYAbs.xy - vec2( 0.2, 2.3 ) ) < 0.05 * smoothstep( 0.2, 0.0, rimshotTime.y )
  );

  b = b || (
    inRange( 2.40, 2.41, vRawPosYAbs.y ) &&
    abs( vRawPosYAbs.x ) < 0.3 + 0.3 * exp( -0.1 * hihatOpen * hihatTime )
  );

  if ( !b ) { discard; }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( 0.7, 0.9, 1.1, 2.0 );
}