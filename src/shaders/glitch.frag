uniform float amp;
uniform float fadeout;
uniform sampler2D sampler0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 uv2 = uv;
  for ( int i = 0; i < 5; i ++ ) {
    float p = pow( 2.0, float( i ) );
    uv2 += amp * vec2( 1.0, 0.0 ) * zp2mp(
      random4( uv2 / vec2( 256.0, 128.0 ) * p + 0.5 * mod( totalFrame, 2.0 ) ).xy
    ) / p;
  }
  vec2 displace = uv2 - uv;
  displace += 0.2 * fadeout * vec2( zp2mp( random4( lofi( uv.y, 1.0 / 48.0 ) ).x ), 0.0 );
  gl_FragColor = vec4( ( 1.0 - fadeout ) * vec3(
    texture2D( sampler0, fract( uv + displace ) ).x,
    texture2D( sampler0, fract( uv + 1.2 * displace ) ).y,
    texture2D( sampler0, fract( uv + 1.4 * displace ) ).z
  ), 1.0 );
}