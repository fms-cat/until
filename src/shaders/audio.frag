float aTime;
float rawTime;
float pattern;

uniform float timeHead;
uniform float patternHead;
uniform float sampleRate;
uniform float bufferSize;
uniform sampler2D samplerChord;

vec2 aNoise2( float t ) {
  return 1.0 - 2.0 * texture2D( samplerRandomStatic, t * vec2( 0.741, 0.891 ) ).xy;
}

float i2f( float i ) {
  float chord = (
    rawTime < SECTION_WHAT_THE ?
    0.0 :
    mod( floor( rawTime / ( 8.0 beat ) ), 4.0 )
  );

  vec2 noteUv = ( vec2( mod( floor( i ), 8.0 ), chord ) + 0.5 ) / vec2( 8.0, 4.0 );
  float note = texture2D( samplerChord, noteUv ).x;

  float trans = -16.8 + (
    rawTime < SECTION_WHAT_THE ?
    0.0 :
    mod( 5.0 - floor( rawTime / ( 8.0 beat ) ), 12.0 ) - 5.0
  );

  return n2f(
    note + trans +
    floor( i / 8.0 ) * 24.0 +
    12.0 * linearstep( SECTION_AAAAA - 16.0 beat, SECTION_AAAAA, rawTime ) +
    ( SECTION_AAAAA < rawTime ? -12.0 : 0.0 )
  ); 
}

vec2 kick( float t ) {
  float attack = rawTime < SECTION_AAAAA ? 3.0 : 20.0;
  float lorate = rawTime < SECTION_AAAAA ? 1E-9 : 0.04;

  return vec2( exp( -10.0 * t ) * sin( TAU * lofi(
    i2f( -8.0 ) * t - attack * ( exp( -40.0 * t ) + exp( -200.0 * t ) ),
    lorate ) ) );
}

vec2 snare( float _phase ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  return aSaturate( (
    aNoise2( _phase / 0.01 ).xy +
    sin( _phase * 3600.0 * vec2( 1.005, 0.995 ) - exp( -_phase * 800.0 ) * 30.0 )
  ) * 4.0 * exp( -_phase * 23.0 ) );
}

vec2 snare909( float _phase ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  return aSaturate( (
    aNoise2( _phase / 0.01 ).xy * 2.0 +
    sin( _phase * 1400.0 * vec2( 1.005, 0.995 ) - exp( -_phase * 80.0 ) * 30.0 )
  ) * 1.0 * exp( -_phase * 10.0 ) );
}

vec2 tableTalking( float t, float offset ) {
  vec4 dice = random4( offset );
  return exp( -mix( 10.0, 30.0, dice.w ) * t ) * aSaturate( 5.0 * aNoise2(
    100.0 * mod( t, mix( 0.008, 0.08, dice.x ) ) * mix( 0.01, 0.03, dice.y ) + 100.0 * dice.z
  ) );
}

vec2 bass( float freq, float t ) {
  vec2 hi = 16.0 + 0.1 * smoothstep( 0.0, 0.4, t ) * vec2( -1.0, 1.0 );
  vec2 fm = 0.1 * smoothstep( 0.0, 0.4, t ) * sin(
    TAU * freq * t + sin( TAU * hi * freq * t )
  );
  return vec2( tri( lofi( freq * t + fm, 0.0625 ) ) );
}

vec2 filterSaw( float freq, float time, float cutoff, float resonance ) {
  if ( time < 0.0 ) { return vec2( 0.0 ); }
  vec2 sum = vec2( 0.0 );
  for ( int i = 1; i <= 32; i ++ ) {
    float fi = float( i );
    float cut = smoothstep( cutoff * 1.2, cutoff * 0.8, fi * freq );
    cut += smoothstep( cutoff * 0.3, 0.0, abs( cutoff - fi * freq ) ) * resonance;
    vec2 offset = vec2( -1.0, 1.0 ) * ( 0.1 * ( fi - 1.0 ) );
    sum += sin( fi * freq * time * TAU + offset ) / fi * cut;
  }
  return sum;
}

vec2 rimshot( float _phase ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  float attack = exp( -_phase * 400.0 ) * 0.6;
  vec2 wave = (
    tri( _phase * 450.0 * vec2( 1.005, 0.995 ) - attack ) +
    tri( _phase * 1800.0 * vec2( 0.995, 1.005 ) - attack )
  );
  return aSaturate( 4.0 * wave * exp( -_phase * 400.0 ) );
}

vec2 cowbell( float _phase ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  float attack = exp( -_phase * 800.0 ) * 20.0;
  vec2 wave = (
    pwm( _phase * 1600.0 * vec2( 1.005, 0.995 ) - attack, vec2( 0.5 ) ) +
    pwm( _phase * 1080.0 * vec2( 0.995, 1.005 ) - attack, vec2( 0.5 ) )
  ) * sin( _phase * 40.0 * TAU );
  return wave * exp( -_phase * 20.0 );
}

vec2 chordSaw( float freq, float time ) {
  vec2 p = fract( time * vec2( 0.99, 1.01 ) * freq );
  return (
    fract( 2.0 * p + 1.6 * sin( 2.0 * TAU * p ) ) - 0.5 +
    fract( 1.0 * p ) - 0.5
  );
}

vec2 wavetable( float freq, float time, float speed, float offset ) {
  if ( time < 0.0 ) { return vec2( 0.0 ); }
  float p = tri( freq * time );
  return aNoise2( p * speed + offset );
}

vec2 clap( float _phase ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  float amp = exp( -14.0 * _phase );
  amp *= mix(
    smoothstep( 0.5, 0.4, sin( 500.0 * _phase ) ),
    1.0,
    smoothstep( 0.04, 0.05, _phase )
  );
  vec2 wave = wavetable( 1.2, _phase, 1.0, 0.0 );
  return lofir( amp * wave, 0.25 );
}

vec2 crash( float _phase, float decay ) {
  if ( _phase < 0.0 ) { return vec2( 0.0 ); }
  float amp = exp( -decay * _phase );
  vec2 wave = wavetable( 96.1, _phase, 0.5, 0.0 );
  return amp * wave;
}

vec2 fmArp( float freq, float time ) {
  if ( time < 0.0 ) { return vec2( 0.0 ); }
  vec2 p = freq * vec2( 0.999, 1.001 ) * time * TAU;
  float dl = exp( -time * 1.0 );
  float ds = exp( -time * 10.0 );
  return (
    sin( p * 1.0003 + sin( p * 11.0035 ) * 1.5 * ds + sin( p * 1.0003 ) * 1.0 * dl ) +
    sin( p * 0.9997 + sin( p * 0.9997 + sin( p * 4.9984 ) * 2.0 * dl ) * 0.5 * ds )
  ) * 0.5 * ds;
}

void main() {
  aTime = timeHead + ( floor( gl_FragCoord.x ) + bufferSize * floor( gl_FragCoord.y ) ) / sampleRate;
  rawTime = aTime + 16.0 beat * patternHead;
  pattern = patternHead + ( 16.0 beat < aTime ? 1.0 : 0.0 );
  aTime = mod( aTime, 16.0 beat );

  vec2 dest = vec2( 0.0 );

  // -- tone -------------------------------------------------------------------
  if ( rawTime < 16.0 beat ) {
    if ( 8.0 beat < aTime ) {
      float freq = mod( aTime, 4.0 beat ) < 1.0 beat ? 2000.0 : 1000.0;
      float amp = smoothstep( 0.05, 0.04, mod( aTime, 1.0 beat ) );
      dest.xy += amp * sin( freq * TAU * aTime );
    }

    gl_FragColor = vec4( dest, 0.0, 0.0 );
    return;
  }

  // -- boom -------------------------------------------------------------------
  if ( inRange( SECTION_AAAAA - 0.6 beat, SECTION_AAAAA, rawTime ) ) {
    float t = ( aTime - 15.5 beat );
    gl_FragColor = vec4( 0.4 * wavetable(
      70.0, t, 0.2 * exp( -12.0 * t ), 0.0
    ), 0.0, 0.0 );
    return;
  }

  aTime = calcRhythms( aTime, rawTime );

  // -- kick -------------------------------------------------------------------
  dest += 0.5 * kick( kickTime );

  // -- sweep ------------------------------------------------------------------
  if ( inRange( SECTION_AAAAA - 16.0 beat, SECTION_AAAAA, rawTime ) ) {
    float buildup = linearstep( SECTION_AAAAA - 16.0 beat, SECTION_AAAAA, rawTime );
    dest += 0.1 * sqrt( buildup ) * wavetable( 40.0, aTime, 0.1 * buildup, 0.0 );
  }

  // -- crash ------------------------------------------------------------------
  {
    float amp = 0.2 * mix( 0.4, 1.0, sidechain );
    dest += (
      inRange( SECTION_HI_ACID, SECTION_HI_ACID + 16.0 beat, rawTime ) ||
      inRange( SECTION_ITS_BEGINNING, SECTION_ITS_BEGINNING + 16.0 beat, rawTime ) ||
      inRange( SECTION_AAAAA, SECTION_AAAAA + 16.0 beat, rawTime ) ||
      inRange( SECTION_WHAT_THE, SECTION_WHAT_THE + 16.0 beat, rawTime ) ||
      inRange( SECTION_FINISH, SECTION_FINISH + 16.0 beat, rawTime )
    ) ? amp * crash( aTime, rawTime < SECTION_AAAAA ? 4.0 : 1.0 ) : vec2( 0.0 );
  }

  // -- clap -------------------------------------------------------------------
  if ( inRange( SECTION_HI_ACID - 1.0 beat, SECTION_ITS_BEGINNING, rawTime ) ) {
    dest += (
      rawTime < SECTION_ITS_BEGINNING - 8.0 beat ?
      0.2 * clap( mod( aTime - 1.0 beat, 2.0 beat ) ) :
      vec2( 0.0 )
    );
  }

  // -- acid -------------------------------------------------------------------
  if ( inRange( SECTION_HI_ACID, SECTION_ITS_BEGINNING, rawTime ) ) {
    if ( mod( aTime, 0.25 beat ) < 0.2 beat ) {
      float t = mod( aTime, 0.25 beat );
      vec4 dice = random4( lofi( rawTime + 4.12, 0.25 beat ) );
      float filt = (
        100.0 +
        mix( 1000.0, 4000.0, dice.z ) * exp( -mix( 20.0, 40.0, dice.w ) * t )
      );
      float freq = (
        i2f( -8.0 + 8.0 * pow( dice.y, 5.0 ) ) *
        ( dice.x < 0.2 ? 1.335 : 1.0 ) *
        ( dice.w < 0.5 ? 2.0 : 1.0 )
      );
      float amp = 0.16 * smoothstep( 0.25 beat, 0.2 beat, t );
      dest += amp * aSaturate( 0.7 * filterSaw( freq, t, filt, filt / 500.0 ) );
    }
  }

  // -- bass -------------------------------------------------------------------
  if ( SECTION_AAAAA < rawTime ) {
    dest += 0.4 * sidechain * bass( i2f( -8.0 ), kickTime );
  }

  // -- hihat ------------------------------------------------------------------
  {
    float amp = 0.3 * exp( -hihatOpen * hihatTime );
    vec2 wave = wavetable( 80.0, hihatTime, 0.4, 0.0 );
    dest += amp * wave;
  }

  // -- click ------------------------------------------------------------------
  if ( rawTime < SECTION_ITS_BEGINNING - 1.0 beat ) {
    float t = mod( aTime, 0.25 beat );
    vec4 dice = random4( lofi( aTime, 0.25 beat ) );
    t = mod( t, 0.25 / pow( 2.0, floor( 5.0 * pow( dice.z, 20.0 ) ) ) beat );
    float amp = 0.3 * exp( -100.0 * t );
    dest += amp * dice.xy;
  }

  // -- clav -------------------------------------------------------------------
  if ( inRange( SECTION_HI_RIM, SECTION_ITS_BEGINNING, rawTime ) ) {
    float amp = exp( -100.0 * clavTime );
    float phase = clavTime + tri( 700.0 * clavTime );
    dest += 0.2 * amp * tri( phase * vec2( 0.9, 1.1 ) );
  }

  // -- rimshot ----------------------------------------------------------------
  if ( inRange( SECTION_HI_RIM, SECTION_ITS_BEGINNING - 4.0 beat, rawTime ) ) {
    dest.x += 0.3 * rimshot( rimshotTime.x ).x;
    dest.y += 0.3 * rimshot( rimshotTime.y ).y;
  }

  // -- snare ------------------------------------------------------------------
  if (
    inRange( SECTION_AAAAA, SECTION_FINISH, rawTime ) &&
    !inRange( SECTION_WHAT_THE - 3.0 beat, SECTION_WHAT_THE, rawTime )
  ) {
    dest += 0.2 * snare( mod( aTime - 1.0 beat, 2.0 beat ) );
  }

  // -- snare909 ---------------------------------------------------------------
  if ( inRange( SECTION_WHAT_THE - 8.0 beat, SECTION_WHAT_THE, rawTime ) ) {
    float t = rawTime < SECTION_WHAT_THE - 2.0 beat ? mod( aTime, 0.25 beat ) : mod( aTime, 0.125 beat );
    float amp = 0.14 * smoothstep( SECTION_WHAT_THE - 8.0 beat, SECTION_WHAT_THE, rawTime );
    dest += amp * snare909( t );
  }

  // -- cowbell ----------------------------------------------------------------
  if ( SECTION_AAAAA < rawTime ) {
    dest += 0.1 * cowbell( mod( aTime - 0.25 beat, 2.0 beat ) );
  }

  // -- ???? -------------------------------------------------------------------
  if ( SECTION_AAAAA < rawTime ) {
    float t = mod( aTime, 32.0 beat );
    float amp = 0.06 * sidechain;
    vec2 wave = wavetable( 170.0, t, sidechain * 0.05, 0.0 );
    dest += amp * wave;

    dest += 0.08 * tableTalking( mod( aTime, 0.25 beat ), 4.8 * lofi( rawTime, 0.25 beat ) );
  }

  // -- pads -------------------------------------------------------------------
  {
    vec2 wave = vec2( 0.0 );
    for ( int i = 0; i < 8; i ++ ) {
      wave += (
        rawTime < SECTION_ITS_BEGINNING + 16.0 beat ?
        vec2( sin( TAU * lofi(
          i2f( float( i ) ) * aTime + sin( float( i ) + 2.0 * aTime ),
          0.0625
        ) ) ) :
        chordSaw( i2f( 2.3 * float( i - 2 ) ), aTime )
      );
    }
    float env = 0.3 * linearstep( SECTION_ITS_BEGINNING + 16.0 beat, SECTION_AAAAA, rawTime );
    float amp = 0.07 * sidechain * (
      rawTime < SECTION_ITS_BEGINNING + 16.0 beat ?
      0.8 * smoothstep( SECTION_ITS_BEGINNING + 16.0 beat, SECTION_ITS_BEGINNING, rawTime ) :
      smoothstep( ( 0.1 + env ) beat, ( -0.2 + env ) beat, mod( aTime, 0.25 beat ) )
    );
    dest += amp * wave;
  }

  // -- arps -------------------------------------------------------------------
  if ( SECTION_HI_ARP < rawTime ) {
    for ( int i = 0; i < 3; i ++ ) {
      float timeD = aTime - float( i ) * 0.75 beat;
      float t = mod( timeD, 0.25 beat );
      vec4 dice = random4( timeD - t + 2.59 );

      float buildup = smoothstep( SECTION_ITS_BEGINNING, SECTION_AAAAA, rawTime );

      float amp = (
        rawTime < SECTION_WHAT_THE ?
        0.12 * exp( -mix( 40.0, 10.0, buildup ) * t ) :
        0.1
      ) * exp( -mix( 4.0, 1.0, buildup ) * float( i ) );
      float freq = (
        rawTime < SECTION_WHAT_THE ?
        i2f( 1.3 * floor( mod( timeD / ( 0.25 beat ), 8.0 ) ) ) :
        i2f(
          floor( 3.0 + 3.0 * tri( ( timeD - t ) / ( 1.0 beat ) ) + dice.x * 10.0 ) +
          ( 0.8 < dice.y && 0.125 beat < t ? 2.0 : 0.0 )
        )
      );
      float form = (
        rawTime < SECTION_WHAT_THE ?
        mix( 0.001, exp( -8.0 * t ) * 0.004, buildup ) :
        -0.0015 * smoothstep( 0.4 beat, 0.0, t )
      );

      dest += amp * wavetable( freq, t, form, dice.w );
    }
  }

  // -- chip -------------------------------------------------------------------
  if ( SECTION_AAAAA < rawTime ) {
    float freq = 2.0 * i2f( floor( mod( aTime * BPM / 3.75, 8.0 ) ) );
    dest += vec2( 0.07 ) * sidechain * pwm( freq * aTime, 0.25 );
  }

  // fade out
  dest *= smoothstep( 150.0, 142.0, rawTime );

  gl_FragColor = vec4( dest, 0.0, 0.0 );
}
