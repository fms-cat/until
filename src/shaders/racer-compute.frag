#define PARTICLE_LIFE_LENGTH 3.0

uniform float trails;
uniform float trailLength;
uniform float ppp;

uniform sampler2D samplerPcompute;
uniform float genRate;

// ------

vec2 vInvert( vec2 _uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * _uv;
}

// ------

vec4 random( vec2 _uv ) {
  return texture2D( samplerRandomDynamic, _uv );
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float mode = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  float dt = deltaTime;

  // == if it is not head of particles =========================================
  if ( ppp < gl_FragCoord.x ) {
    puv.x -= ppp / resolution.x;
    vec4 pos = texture2D( samplerPcompute, puv );
    vec4 vel = texture2D( samplerPcompute, puv + dpix * vec2( 1.0, 0.0 ) );

    pos.z += zOffset.y * dt;
    pos.w = saturate( pos.w - 1.0 / trailLength );

    gl_FragColor = (
      mode < 1.0 ? pos :
      vel
    );
    return;
  }

  // == prepare some vars for fuck around head particle ========================
  vec4 seed = texture2D( samplerRandomDynamic, puv );
  prng( seed );

  vec4 pos = texture2D( samplerPcompute, puv );
  vec4 vel = texture2D( samplerPcompute, puv + dpix * vec2( 1.0, 0.0 ) );

  float timing = mix( 0.0, PARTICLE_LIFE_LENGTH, floor( puv.y * trails ) / trails );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == initialize particles ===================================================
  if (
    time - deltaTime < timing && timing <= time
  ) {
    dt = time - timing;

    pos.xyz = 2.0 * randomSphere( seed ) - vec3( 0.0, 0.0, zOffset.y );

    vel.xyz = 1.0 * randomSphere( seed );
    vel.w = 1.0; // jumping flag

    pos.w = prng( seed ) < genRate ? 1.0 : 0.0; // life
  } else {
    vel.w = 0.0; // remove jumping flag
  }

  // == update particles =======================================================
  vel.xyz += 10.0 * vec3(
    noise4d( vec4( 0.4 * pos.xyz, 1.845 + 0.1 * time ) ),
    noise4d( vec4( 0.4 * pos.xyz, 2.853 + 0.1 * time ) ),
    noise4d( vec4( 0.4 * pos.xyz, 4.129 + 0.1 * time ) )
  ) * dt;
  vel.xy += 4.0 * dt * smoothstep( 2.0, 1.0, length( pos.xy ) ) * normalize( pos.xy );
  vel.xyz *= exp( -1.0 * dt );

  vec3 velt = vel.xyz;
  velt.x *= abs( velt.x ) < abs( velt.y ) ? 0.0 : abs( velt.x ) < abs( velt.z ) ? 0.0 : 1.0;
  velt.y *= abs( velt.y ) < abs( velt.z ) ? 0.0 : abs( velt.y ) < abs( velt.x ) ? 0.0 : 1.0;
  velt.z *= abs( velt.z ) < abs( velt.x ) ? 0.0 : abs( velt.z ) < abs( velt.y ) ? 0.0 : 1.0;

  pos.xyz += normalize( velt ) * 0.04;
  pos.z += zOffset.y * dt;

  gl_FragColor = (
    mode < 1.0 ? pos :
    vel
  );
}