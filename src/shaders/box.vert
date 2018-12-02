// == attributes ===============================================================
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aMatrix;

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vNor;

uniform bool isShadow;

uniform float posOffset;
uniform float spinOffset;
uniform float size;

uniform mat4 matM;

// == main =====================================================================
void main() {
  calcRhythms();

  vec4 pos = vec4( ( 1.0 + 0.2 * sin( PI * exp( -10.0 * kickTime ) ) ) * size * aPos, 1.0 );
  pos.yz = rotate2D( spinOffset * aMatrix.x + 1.3 * time ) * pos.yz;
  pos.zx = rotate2D( spinOffset * aMatrix.y + 0.7 * time ) * pos.zx;
  pos.xy += posOffset * aMatrix;
  pos = matM * pos;
  vPos = pos.xyz;

  vec4 nor = vec4( aNor, 0.0 );
  nor.yz = rotate2D( spinOffset * aMatrix.x + 1.3 * time ) * nor.yz;
  nor.zx = rotate2D( spinOffset * aMatrix.y + 0.7 * time ) * nor.zx;
  nor = normalize( matM * nor );
  vNor = nor.xyz;

  vec4 outPos;
  if ( isShadow ) {
    outPos = matPL * matVL * pos;
  } else {
    outPos = matP * matV * pos;
    outPos.x /= resolution.x / resolution.y;
  }
  gl_Position = outPos;
}