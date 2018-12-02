// == attributes ===============================================================
attribute vec3 aPos;
attribute vec2 aUv;
attribute vec3 aNor;

// == varyings =================================================================
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNor;

// == uniforms =================================================================
uniform bool isShadow;
uniform mat4 matM;

// == main =====================================================================
void main() {
  vec4 pos = matM * vec4( aPos, 1.0 );
  vPos = pos.xyz;

  vUv = aUv;

  vec4 nor = normalize( matM * vec4( aNor, 0.0 ) );
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