#extension GL_EXT_draw_buffers : require
precision highp float;

// ------

void main() {
  gl_FragData[ 0 ] = vec4( bgColor, 1.0 );
  gl_FragData[ 1 ] = vec4( far, 0.0, 0.0, 1.0 );
}