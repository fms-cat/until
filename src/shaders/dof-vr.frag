#define FOG_ONE calcDepth(mix(near,far,0.25))
#define FOG_ZERO calcDepth(far)

uniform sampler2D samplerDry;
uniform sampler2D samplerDepth;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  vec3 col = texture2D( samplerDry, uv ).xyz;
  float len = texture2D( samplerDepth, uv ).x;
  col = mix( bgColor.xyz, col, linearstep( FOG_ZERO, FOG_ONE, len ) );

  gl_FragColor = vec4( col, 1.0 );
}
