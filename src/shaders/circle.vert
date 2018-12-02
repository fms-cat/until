// == attributes ===============================================================
attribute vec3 aPos;
attribute vec2 aUv;
attribute vec3 aNor;
attribute float aMatrix;

// == varyings =================================================================
varying vec3 vPos;
varying vec2 vUv;
varying vec3 vNor;
varying float vScale;
varying float vPattern;

// == uniforms =================================================================
uniform bool isShadow;

// == main =====================================================================
void main() {
  vec4 pos = vec4( aPos, 1.0 );
  pos.z += mod( aMatrix + zOffset.x, 30.0 ) - 20.0;
  vPos = pos.xyz;

  float rot = time * zp2mp( random4( aMatrix * 0.4 + 0.1 ).x );
  pos.xy = rotate2D( rot ) * pos.xy;

  vUv = aUv;
  vScale = 1.5;
  vPattern = mod( aMatrix, 3.0 );

  vec4 nor = normalize( vec4( aNor, 0.0 ) );
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