precision highp float;

uniform sampler2D sampler0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = texture2D( sampler0, uv );
}