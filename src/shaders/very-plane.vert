// == attributes ===============================================================
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aMatrix;

// == varyings =================================================================
varying vec3 vPos;
varying vec3 vNor;
varying float vFlip;

// == nani =====================================================================
uniform bool isShadow;
uniform float flipThreshold;

uniform mat4 matM;

// == main =====================================================================
void main() {
  vec4 pos = vec4( 0.4 * aPos, 1.0 );
  float t = mod( time - 1.0 beat, 2.0 beat );
  float aaaa = random4( 0.179 * aMatrix + 0.188 * ( time - t ) ).x;

  float flip = PI * smoothstep( 1.0, 0.1, exp( -5.0 * t ) );
  pos.zx = rotate2D(
    aaaa < flipThreshold * 0.25 ? flip :
    aaaa < flipThreshold * 0.5 ? -flip :
    0.0
  ) * pos.zx;
  pos.yz = rotate2D(
    aaaa < flipThreshold * 0.5 ? 0.0 :
    aaaa < flipThreshold * 0.75 ? flip :
    aaaa < flipThreshold ? -flip :
    0.0
  ) * pos.yz;
  vFlip = sin( aaaa < flipThreshold ? sin( flip ) : 0.0 );

  pos.x += 2.0 * aMatrix.x;
  pos.y += mod( 2.0 * aMatrix.y - zOffset.x, 60.0 ) - 20.0;
  pos = matM * pos;

  float bbbb = random4( 0.179 * aMatrix ).x;
  pos.y += 1.0 * noise4d( vec4( 0.1 * pos.zx, 0.1 * time, 6.724 ) );
  vPos = pos.xyz;

  vec4 nor = vec4( aNor, 0.0 );
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