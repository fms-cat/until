attribute vec2 aComputeUV;

varying vec3 vPos;
varying float vLife;

uniform float trails;
uniform float trailLength;
uniform float ppp;

uniform bool isShadow;

uniform float colorVar;
uniform float colorOffset;

uniform sampler2D samplerPcompute;

void main() {
  // == fetch compute texture ==================================================
  vec2 puv = aComputeUV;
  vec2 dppix = vec2( 1.0 ) / vec2( trailLength, trails );

  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 vel = texture2D( samplerPcompute, puv + dppix * vec2( 1.0, 0.0 ) );

  // == ???????? ===============================================================
  vec4 dice = texture2D( samplerRandomStatic, puv.xy * 182.92 );

  // == assign varying variables ===============================================
  vLife = pos.w;

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
  gl_PointSize = 5.0 * resolution.y * 0.01 / outPos.z / tan( perspFov * PI / 360.0 );
}