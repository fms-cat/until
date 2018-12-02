attribute vec2 computeUV;

varying vec4 vPos;
varying vec3 vCol;
varying vec2 vUv;
varying float vSize;

uniform vec2 resolutionPcompute;

uniform bool isShadow;

uniform float colorVar;
uniform float colorOffset;

uniform sampler2D samplerPcompute;

void main() {
  // == fetch compute texture ==================================================
  vec2 puv = computeUV;
  vec2 dppix = vec2( 1.0 ) / resolutionPcompute;

  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 col = texture2D( samplerPcompute, puv + dppix * vec2( 1.0, 0.0 ) );

  // == geometry ===============================================================
  float kickBeat = exp( -10.0 * mod( mod( time, 2.0 beat ), 0.75 beat ) );

  vSize = 0.042 * (
    ( 1.0 - exp( -10.0 * pos.w ) ) *
    smoothstep( 10.0, 9.0, pos.w )
  );

  // == special chars ==========================================================
  if ( col.w == 256.0 ) { // Ā
    float wave = 0.5 + 0.5 * sin( 10.0 * pos.x + 10.0 * time );
    col = vec4( mix(
      col.xyz,
      vec3( 1.8, 0.1, 0.5 ),
      wave
    ), 3.0 );
    vSize *= 1.0 + 0.5 * wave;
  } else if ( col.w == 257.0 ) { // ā
    float b = exp( -5.0 * mod( mod( time, 2.0 beat ), 0.75 beat ) );
    col = vec4( mix(
      col.xyz,
      vec3( 1.8, 0.8, 3.8 ),
      kickBeat
    ), 14.0 );
    vSize *= 1.0 + kickBeat;
  } else if ( col.w == 258.0 ) { // Ă
    col = vec4( mix(
      vec3( 1.1, 0.5, 0.1 ),
      vec3( 0.7, 1.4, 0.3 ),
      floor( mod( totalFrame, 4.0 ) / 2.0 )
    ), 2.0 );
  }

  // == assign varying variables ===============================================
  vCol = col.xyz;
  float ch = col.w;
  vUv = floor( vec2( mod( ch, 16.0 ), col.w / 16.0 ) );

  // == finalize ===============================================================
  vPos = pos;

  vec4 outPos;
  if ( isShadow ) {
    outPos = matPL * matVL * vec4( pos.xyz, 1.0 );
  } else {
    outPos = matP * matV * vec4( pos.xyz, 1.0 );
    outPos.x /= resolution.x / resolution.y;
  }
  gl_Position = outPos;
  gl_PointSize = vSize * resolution.y / outPos.z / tan( perspFov * PI / 360.0 );
}