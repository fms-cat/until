// Ref: https://www.shadertoy.com/view/4d2Xzw

#define FOG_ONE calcDepth(mix(near,far,0.25))
#define FOG_ZERO calcDepth(far)
#define BOKEH_ITER 10
#define BOKEH_ANGLE 2.39996
#define BOKEH_RADIUS_MAX (resolution.x / 64.0)

uniform sampler2D samplerDry;
uniform sampler2D samplerDepth;

uniform float bokehAmp;
uniform float bokehFocus;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float radiusPerStep = BOKEH_RADIUS_MAX / float( BOKEH_ITER );
  float radius = radiusPerStep * 1E-5; // EPSILON
  vec4 seed = texture2D( samplerRandomDynamic, uv );
  prng( seed ); // mix well
  prng( seed ); // mix well
  vec2 nOffset = vec2( 0.0, 1.0 ) * rotate2D( TAU * prng( seed ) );
  mat2 rotator = rotate2D( BOKEH_ANGLE );

  vec4 sum = vec4( 0.0 );

  for ( int i = 0; i < BOKEH_ITER; i ++ ) {
    vec2 uv = ( gl_FragCoord.xy + nOffset * radius ) / resolution;
    vec3 col = texture2D( samplerDry, uv ).xyz;
    float len = texture2D( samplerDepth, uv ).x;

    col = mix( bgColor.xyz, col, linearstep( FOG_ZERO, FOG_ONE, len ) );

    float r = min( max( abs( 1.0 / len - 1.0 / calcDepth( bokehFocus ) ) * bokehAmp, 1E-2 ), BOKEH_RADIUS_MAX );
    float amp = 1.0 / ( r / BOKEH_RADIUS_MAX * float( BOKEH_ITER ) );
    amp *= linearstep( radius, radius + radiusPerStep, r );
    sum += vec4( col, 1.0 ) * amp;

    nOffset = rotator * nOffset;
    radius += radiusPerStep;
  }

  gl_FragColor = vec4( sum.xyz / sum.w, 1.0 );
}
