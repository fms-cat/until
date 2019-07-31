precision highp float;

varying vec2 uv;
uniform sampler2D sampler0;

void main() {
  gl_FragColor = texture2D( sampler0, uv );
}