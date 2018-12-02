uniform float nParticleSqrt;
uniform float nParticle;
uniform float ppp;

uniform sampler2D samplerPcompute;

uniform vec4 logPos;
uniform vec3 logOffset;
uniform vec4 logCol;
uniform bool logReturn;
uniform bool logDrop;

// ------

vec4 sampleRandom( vec2 _uv ) {
  return texture2D( samplerRandomDynamic, _uv );
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float mode = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  // == prepare some vars ======================================================
  vec4 seed = texture2D( samplerRandomStatic, puv );
  prng( seed );

  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 col = texture2D( samplerPcompute, puv + dpix * vec2( 1.0, 0.0 ) );

  float index = floor( uv.x * nParticleSqrt ) + floor( uv.y * nParticleSqrt ) * nParticleSqrt;

  if ( logPos.w == index ) {
    // == generate particles ===================================================
    pos = logPos;
    pos.xyz += logOffset;
    pos.w = 0.0; // lifetime

    col = logCol;
  }

  // == update particles =======================================================
  pos.y += logReturn ? 0.12 : 0.0;
  pos.w += deltaTime + ( logDrop ? 1E9 : 0.0 );

  gl_FragColor = (
    mode < 1.0 ? pos :
    col
  );
}