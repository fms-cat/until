#define BARREL_ITER 10

// == uniforms =================================================================
uniform float barrelAmp;
uniform float barrelOffset;
uniform sampler2D sampler0;

// == distort a coordination and sample a texture ==============================
vec3 barrel( float amp, vec2 uv ) {
  float corn = length( vec2( 0.5 ) );
  float a = min( 3.0 * sqrt( amp ), corn * PI );
  float zoom = corn / ( tan( corn * a ) + corn );
  vec2 p = saturate(
    ( uv + normalize( uv - 0.5 ) * tan( length( uv - 0.5 ) * a ) ) * zoom +
    0.5 * ( 1.0 - zoom )
  );
  return texture2D( sampler0, vec2( p.x, p.y ) ).xyz;
}

// == main =====================================================================
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  // == glitch =================================================================
  vec3 tex = vec3( 0.0 );

  // == do barrel distortion ===================================================
  for ( int i = 0; i < BARREL_ITER; i ++ ) {
    float fi = ( float( i ) + 0.5 ) / float( BARREL_ITER );
    vec3 a = saturate( vec3(
      1.0 - 3.0 * abs( 1.0 / 6.0 - fi ),
      1.0 - 3.0 * abs( 1.0 / 2.0 - fi ),
      1.0 - 3.0 * abs( 5.0 / 6.0 - fi )
    ) ) / float( BARREL_ITER ) * 4.0;
    tex += a * barrel( barrelOffset + barrelAmp * fi, uv );
  }

  // == do vignette ============================================================
  float vig = 1.0 - length( p ) * 0.4;
  tex = mix( vec3( 0.0 ), tex, vig );

  // == do color correction ====================================================
  vec3 col = pow( saturate( tex.xyz ), vec3( 1.0 / 1.6 ) );
  col = vec3(
    smoothstep( 0.00, 1.00, col.x ),
    col.y,
    0.1 + 0.8 * col.z
  );

  // == done ===================================================================
  gl_FragColor = vec4( col, 1.0 );
}