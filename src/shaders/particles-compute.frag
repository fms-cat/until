#define PARTICLE_LIFE_LENGTH 3.0

uniform float nParticleSqrt;
uniform float nParticle;
uniform float ppp;

uniform sampler2D samplerPcompute;

uniform float noisePhase;
uniform float velScale;
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
  calcRhythms();

  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float mode = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  float dt = deltaTime;

  // == prepare some vars ======================================================
  vec4 seed = texture2D( samplerRandomDynamic, puv );
  prng( seed );

  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 vel = texture2D( samplerPcompute, puv + dpix * vec2( 1.0, 0.0 ) );

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

    pos.xyz = 4.0 * randomSphere( seed ) - vec3( 0.0, 0.0, 5.0 );

    vel.xyz = 0.0 * randomSphere( seed );
    vel.w = 0.0;

    pos.w = 1.0; // life
  } else {
    // == update particles =======================================================
    vel.xyz += dt * ( 10.0 + 20.0 * exp( -5.0 * kickTime ) ) * vec3(
      noise4d( vec4( 0.8 * pos.xyz, 1.485 + 0.1 * time ) ),
      noise4d( vec4( 0.8 * pos.xyz, 3.485 + 0.1 * time ) ),
      noise4d( vec4( 0.8 * pos.xyz, 5.485 + 0.1 * time ) )
    );
    vel.xyz += 4.0 * dt * smoothstep( 3.0, 1.5, length( pos.xyz ) ) * normalize( pos.xyz );
    vel.xyz *= exp( -5.0 * dt );

    pos.xyz += vel.xyz * dt;
    pos.z += zOffset.y * dt;
    pos.w -= dt / PARTICLE_LIFE_LENGTH;
  }

  gl_FragColor = (
    mode < 1.0 ? pos :
    vel
  );
}