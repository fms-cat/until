uniform vec3 bias;
uniform vec3 factor;
uniform sampler2D sampler0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 deltaTexel = 0.25 / resolution;
  vec2 uvOrigin = ( floor( gl_FragCoord.xy ) + deltaTexel * 0.5 ) / resolution;

  vec3 sum = vec3( 0.0 );
  for ( int iy = 0; iy < 4; iy ++ ) {
    for ( int ix = 0; ix < 4; ix ++ ) {
      vec2 uv = uvOrigin + vec2( ix, iy ) * deltaTexel;
      sum += texture2D( sampler0, uv ).xyz / 16.0;
    }
  }

  gl_FragColor = vec4(
    max( vec3( 0.0 ), ( sum + bias ) * factor ),
    1.0
  );
}
