#define SAMPLES 20
#define MUL_THR 0.01

// ------

uniform bool isVert;
uniform sampler2D sampler0;

uniform float var;

float gaussian( float _x, float _v ) {
  return 1.0 / sqrt( 2.0 * PI * _v ) * exp( - _x * _x / 2.0 / _v );
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  if ( var <= 0.0 ) {
    gl_FragColor = texture2D( sampler0, uv );
    return;
  }

  vec2 bv = ( isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) ) / resolution;

  vec3 sum = vec3( 0.0 );
  for ( int i = 0; i <= SAMPLES; i ++ ) {
    float mul = gaussian( abs( float( i ) ), var );
    if ( mul < MUL_THR ) { break; }
    for ( int j = -1; j < 2; j += 2 ) {
      vec2 v = saturate( uv + bv * float( i * j ) );
      vec3 tex = texture2D( sampler0, v ).xyz;
      sum += tex * mul;
      if ( i == 0 ) { break; }
    }
  }

  gl_FragColor = vec4( sum, 1.0 );
}
