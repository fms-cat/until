void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  if ( time < 8.0 beat ) {
    gl_FragColor = vec4( uv, time / ( 8.0 beat ), 1.0 );
  } else {
    vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;
    float radius = 0.3 * exp( -fract( time / ( 1.0 beat ) ) );
    float shape = linearstep( 2.0 / resolution.y, 0.0, length( p ) - radius );
    gl_FragColor = vec4( vec3( shape ), 1.0 );
  }
}