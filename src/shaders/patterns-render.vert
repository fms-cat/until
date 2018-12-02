attribute vec3 aPos;
attribute vec2 aComputeUV;

varying vec3 vPos;
varying vec3 vRawPos;
varying vec3 vCol;
varying float vLife;
varying float vMode;

uniform vec2 resolutionPcompute;

uniform bool isShadow;

uniform float colorVar;
uniform float colorOffset;

uniform sampler2D samplerPcompute;

void main() {
  // == fetch compute texture ==================================================
  vec2 puv = aComputeUV;
  vec2 dppix = vec2( 1.0 ) / resolutionPcompute;

  vec4 pos = texture2D( samplerPcompute, puv );

  // == ???????? ===============================================================
  vec4 dice = texture2D( samplerRandomStatic, puv.xy * 182.92 );

  // == assign varying variables ===============================================
  vLife = pos.w;

  // vCol = (
  //   dice.y < 0.8
  //   ? pow( catColor( TAU * ( ( dice.x * 2.0 - 1.0 ) * colorVar + colorOffset ) ), vec3( 2.0 ) )
  //   : vec3( 0.4 )
  // );
  // vCol = abs( vel.xyz );
  vCol = 2.0 * exp( 2.3 * ( vLife - 1.0 ) ) * catColor( 6.9 + 2.0 * ( 1.0 - vLife ) );

  // == geometry ===============================================================
  float size = 0.2;
  pos.xyz += aPos * size;
  vRawPos = aPos;
  vMode = floor( 4.0 * dice.y );

  // == finalize ===============================================================
  vPos = pos.xyz;

  vec4 outPos;
  if ( isShadow ) {
    outPos = matPL * matVL * vec4( pos.xyz, 1.0 );
  } else {
    outPos = matP * matV * vec4( pos.xyz, 1.0 );
    outPos.x /= resolution.x / resolution.y;
  }
  gl_Position = outPos;
}