uniform sampler2D sampler0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec4 pos = texture2D( sampler0, uv );
  gl_FragColor = vec4( calcDepth( pos.xyz - cameraPos ), 0.0, 0.0, 1.0 );
}