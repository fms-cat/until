#define PARTICLE_LIFE_LENGTH 0.5

uniform float nParticleSqrt;
uniform float nParticle;
uniform float ppp;

uniform sampler2D samplerPcompute;

uniform float genRate;

// ------

vec2 vInvert( vec2 _uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * _uv;
}

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

  float dt = deltaTime;

  // == prepare some vars ======================================================
  vec4 seed = texture2D( samplerRandomDynamic, puv );
  prng( seed );

  vec4 pos = texture2D( samplerPcompute, puv );

  float timing = mix( 0.0, PARTICLE_LIFE_LENGTH, floor( puv.y * nParticleSqrt ) / nParticleSqrt );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == generate particles =====================================================
  if (
    time - deltaTime < timing && timing <= time &&
    prng( seed ) < genRate
  ) {
    dt = time - timing;

    pos.xyz = 3.0 * randomBox( seed ) - vec3( 0.0, 0.0, 2.0 );
    pos.w = 1.0; // life
  } else {
    // == update particles =====================================================
    pos.z += zOffset.y * dt;
    pos.w -= dt / PARTICLE_LIFE_LENGTH;
  }

  gl_FragColor = pos;
}