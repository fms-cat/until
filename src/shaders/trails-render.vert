attribute float computeU;
attribute float computeV;
attribute float triIndex;

varying vec3 vPos;
varying vec3 vNor;
varying vec3 vCol;
varying float vLife;
varying float vIsOkayToDraw;

uniform vec2 resolutionPcompute;
uniform float ppp;

uniform sampler2D samplerPcompute;

void main() {
  vec2 puv = vec2( computeU, computeV );
  vec2 dppix = vec2( 1.0 ) / resolutionPcompute;

  // == fetch texture ==========================================================
  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 vel = texture2D( samplerPcompute, puv + dppix * vec2( 1.0, 0.0 ) );
  vec4 velp = texture2D( samplerPcompute, puv + dppix * vec2( -ppp + 1.0, 0.0 ) );

  // == assign varying variables ===============================================
  vLife = pos.w;
  vPos = pos.xyz;

  vec4 dice = texture2D( samplerRandomStatic, puv.yy * 182.92 );
  vCol = dice.z < 0.7 ? vec3( 0.8, 0.2 * dice.xy ) : vec3( 0.8 );

  vIsOkayToDraw = ( velp.w < 0.5 && vel.w < 0.5 ) ? 1.0 : 0.0;

  // == compute size and direction =============================================
  float size = 0.003 + 0.01 * pow( dice.w, 2.0 );
  vec3 dir = normalize( vel.xyz );
  vec3 sid = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) );
  vec3 top = normalize( cross( sid, dir ) );

  float theta = triIndex / 3.0 * TAU + vLife * 1.0;
  vec2 tri = vec2( sin( theta ), cos( theta ) );
  vNor = ( tri.x * sid + tri.y * top );
  pos.xyz += size * vNor;

  vec4 outPos = matP * matV * vec4( pos.xyz, 1.0 );
  outPos.x /= resolution.x / resolution.y;
  gl_Position = outPos;
}