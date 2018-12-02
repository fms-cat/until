#define FXAA_REDUCE_MIN (1.0 / 128.0)
#define FXAA_REDUCE_MUL (1.0 / 8.0)
#define FXAA_SPAN_MAX 16.0

// ------

precision highp float;

uniform sampler2D sampler0;

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  #define T(v) texture2D( sampler0, (v) / resolution ).xyz
  vec3 rgb11 = T( gl_FragCoord.xy );
  vec3 rgb00 = T( gl_FragCoord.xy + vec2( -1.0, -1.0 ) );
  vec3 rgb02 = T( gl_FragCoord.xy + vec2( -1.0,  1.0 ) );
  vec3 rgb20 = T( gl_FragCoord.xy + vec2(  1.0, -1.0 ) );
  vec3 rgb22 = T( gl_FragCoord.xy + vec2(  1.0,  1.0 ) );
  #undef T

  vec3 luma = vec3( 0.299, 0.587, 0.114 );
  #define L(c) dot( c, luma )
  float luma11 = L( rgb11 );
  float luma00 = L( rgb00 );
  float luma02 = L( rgb02 );
  float luma20 = L( rgb20 );
  float luma22 = L( rgb22 );
  #undef L

  float lumaMin = min( luma00, min( min( luma00, luma02 ), min( luma20, luma22 ) ) );
  float lumaMax = max( luma00, max( max( luma00, luma02 ), max( luma20, luma22 ) ) );

  vec2 dir = vec2(
    -( ( luma00 + luma20 ) - ( luma02 + luma22 ) ),
    ( ( luma00 + luma02 ) - ( luma20 + luma22 ) )
  );

  float dirReduce = max(
    ( luma00 + luma02 + luma20 + luma22 ) * 0.25 * FXAA_REDUCE_MUL,
    FXAA_REDUCE_MIN
  );
  float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );
  dir = min(
    vec2( FXAA_SPAN_MAX ),
    max(
      vec2( -FXAA_SPAN_MAX ),
      dir * rcpDirMin
    )
  ) / resolution;

  vec3 rgbA = 0.5 * (
    texture2D( sampler0, uv + dir * ( 1.0 / 3.0 - 0.5 ) ).xyz +
    texture2D( sampler0, uv + dir * ( 2.0 / 3.0 - 0.5 ) ).xyz
  );
  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture2D( sampler0, uv - dir * 0.5 ).xyz +
    texture2D( sampler0, uv + dir * 0.5 ).xyz
  );

  float lumaB = dot( rgbB, luma );
  gl_FragColor = (
    ( ( lumaB < lumaMin ) || ( lumaMax < lumaB ) ) ?
    vec4( rgbA, 1.0 ) :
    vec4( rgbB, 1.0 )
  );
}