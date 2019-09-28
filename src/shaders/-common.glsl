// == defines ==================================================================
#define PI 3.141592654
#define TAU 6.283185307
#define HUGE 9E16
#define BPM 160.0
#define saturate(i) clamp(i, 0.,1.)
#define aSaturate(i) clamp(i, -1.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+0.5)*(m))
#define pwm(x,d) (step(fract(x),(d))*2.0-1.0)
#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define n2f(n) (440.0*pow(2.0,(n)/12.0))
#define inRange(a,b,x) ((a)<=(x)&&(x)<(b))
#define geta(i,m) (m)
#define sinexp(i) (sin(PI*exp(i)))
#define mp2zp(i) (.5+.5*(i))
#define zp2mp(i) ((i)*2.-1.)
#define beat *60.0/BPM

// == sections =================================================================
#define SECTION_HI_RIM (48.0 beat)
#define SECTION_HI_ACID (80.0 beat)
#define SECTION_HI_ARP (112.0 beat)
#define SECTION_ITS_BEGINNING (144.0 beat)
#define SECTION_AAAAA (240.0 beat)
#define SECTION_WHAT_THE (304.0 beat)
#define SECTION_FINISH (368.0 beat)

// == h ========================================================================
precision highp float;

// == globals ==================================================================
float kickTime;
float sidechain;
vec2 rimshotTime;
float clavTime;
float hihatTime;
float hihatOpen;

// == uniforms =================================================================
uniform bool isInitialFrame;
uniform float time;
uniform vec2 resolution;
uniform float progress;
uniform float deltaTime;
uniform float totalFrame;
uniform vec3 cameraPos;
uniform vec3 cameraTar;
uniform float cameraRoll;
uniform float perspFov;
uniform float perspNear;
uniform float perspFar;
uniform vec3 lightPos;
uniform vec3 lightCol;
uniform mat4 matP;
uniform mat4 matV;
uniform mat4 matPL;
uniform mat4 matVL;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerRandomDynamic;
uniform vec2 zOffset;
uniform vec2 mouse;
uniform vec3 bgColor;
uniform vec4 viewport;

// == prng =====================================================================
float prng(inout vec4 n)
{
  // Based on the post http://gpgpu.org/forums/viewtopic.php?t=2591&sid=17051481b9f78fb49fba5b98a5e0f1f3
  // (The page no longer exists as of March 17th, 2015. Please let me know if you see why this code works.)
  const vec4 q = vec4(   1225.0,    1585.0,    2457.0,    2098.0);
  const vec4 r = vec4(   1112.0,     367.0,      92.0,     265.0);
  const vec4 a = vec4(   3423.0,    2646.0,    1707.0,    1999.0);
  const vec4 m = vec4(4194287.0, 4194277.0, 4194191.0, 4194167.0);

  vec4 beta = floor(n / q);
  vec4 p = a * (n - beta * q) - beta * r;
  beta = (sign(-p) + vec4(1.0)) * vec4(0.5) * m;
  n = (p + beta);

  return fract(dot(n / m, vec4(1.0, -1.0, 1.0, -1.0)));
}

vec3 randomSphere( inout vec4 seed ) {
  vec3 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec3(
      prng( seed ),
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec2 randomCircle( inout vec4 seed ) {
  vec2 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec2(
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec3 randomBox( inout vec4 seed ) {
  vec3 v;
  v = vec3(
    prng( seed ),
    prng( seed ),
    prng( seed )
  ) * 2.0 - 1.0;
  return v;
}

// == snoise ===================================================================
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
  {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

  return p;
  }

// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451

float noise4d(vec4 v)
  {
  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                        0.276393202250021,  // 2 * G4
                        0.414589803375032,  // 3 * G4
                       -0.447213595499958); // -1 + 4 * G4

// First corner
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C.xxxx
  //  x1 = x0 - i1  + 1.0 * C.xxxx
  //  x2 = x0 - i2  + 2.0 * C.xxxx
  //  x3 = x0 - i3  + 3.0 * C.xxxx
  //  x4 = x0 - 1.0 + 4.0 * C.xxxx
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

// Permutations
  i = mod289(i);
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

  }

// == misc. ====================================================================
float calcDepth( float z ) {
  return linearstep( perspNear, perspFar, z );
}

float calcDepth( vec3 v ) {
  return calcDepth( dot( normalize( cameraTar - cameraPos ), v ) );
}

float calcDepthL( vec3 v ) {
  return calcDepth( dot( normalize( cameraTar - lightPos ), v ) );
}

vec4 random4( float t ) {
  return texture2D( samplerRandomStatic, lofi( t * vec2( 0.741, 0.891 ), 1.0 / 2048.0 ) + 0.5 / 2048.0 );
}

vec4 random4( vec2 v ) {
  return texture2D( samplerRandomStatic, lofi( v, 1.0 / 2048.0 ) + 0.5 / 2048.0 );
}

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

float smin( float a, float b, float k ) {
  float res = exp( -k * a ) + exp( -k * b );
  return -log( res ) / k;
}

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 4.0 ),
    cos( _p + PI / 3.0 * 2.0 )
  );
}

// == rhythms ==================================================================
float calcRhythms( float aTime, float rawTime ) {
  // -- glitch -----------------------------------------------------------------
  {
    vec4 dice = random4( lofi( aTime, 0.5 beat ) - 4.78 );
    float thr = (
      rawTime < SECTION_AAAAA ?
      0.2 * linearstep( SECTION_AAAAA - 10.0 beat, SECTION_AAAAA, rawTime ) :
      0.0
    );

    if ( dice.x < thr ) {
      aTime -= 0.82 * lofi( mod( aTime, 0.5 beat ), 0.03 );
    } else if ( dice.x < 2.0 * thr ) {
      aTime -= 0.95 * lofi( mod( aTime, 0.5 beat ), 0.017 );
    } else if ( dice.x < 3.0 * thr ) {
      aTime -= lofi( mod( aTime, 0.5 beat ), 0.125 beat );
    } else if ( dice.x < 4.0 * thr ) {
      aTime -= pow( 2.0 * mod( aTime, 0.5 beat ), 2.0 );
    }
  }

  // -- kick -------------------------------------------------------------------
  kickTime = mod( mod( aTime, 2.0 beat ), 0.75 beat );
  sidechain = smoothstep( 0.0, 0.3, kickTime );
  kickTime = (
    rawTime < ( SECTION_ITS_BEGINNING - 8.0 beat ) ? kickTime :
    rawTime < SECTION_ITS_BEGINNING ? aTime - 8.0 beat :
    rawTime < ( SECTION_AAAAA - 4.0 beat ) ? mod( aTime, 2.0 beat ) :
    rawTime < SECTION_AAAAA ? aTime - 12.0 beat :
    inRange( SECTION_WHAT_THE - 4.0 beat, SECTION_WHAT_THE, rawTime ) ? aTime - 12.0 beat :
    SECTION_FINISH + 0.75 beat < rawTime ? rawTime - SECTION_FINISH :
    kickTime
  );
  kickTime += 15.75 beat < aTime ? ( aTime - 15.75 beat ) : 0.0;

  // -- rimshot ----------------------------------------------------------------
  rimshotTime = (
    inRange( SECTION_HI_RIM, SECTION_ITS_BEGINNING - 4.0 beat, rawTime )
    ? vec2(
      mod( mod( mod( aTime, 2.25 beat ), 1.25 beat ), 0.5 beat ),
      mod( mod( mod( aTime - 0.25 beat, 2.75 beat ), 0.75 beat ), 0.5 beat )
    )
    : vec2( 1E9 )
  );

  // -- clav -------------------------------------------------------------------
  clavTime = (
    inRange( SECTION_HI_RIM, SECTION_ITS_BEGINNING, rawTime )
    ? mod( mod( mod( aTime - 0.75, 3.75 beat ), 2.75 beat ), 0.75 beat )
    : 1E9
  );

  // -- hihat ------------------------------------------------------------------
  hihatTime = mod( aTime, 0.5 beat );
  vec4 dice = random4( aTime - hihatTime );
  float trrr = rawTime < SECTION_ITS_BEGINNING ? 1.9 : 2.2;
  hihatOpen = rawTime < SECTION_ITS_BEGINNING ? 200.0 : mix( 20.0, 200.0, dice.x );
  hihatTime = mod( hihatTime, 0.5 / pow( 2.0, floor( trrr * dice.z ) ) beat );
  hihatTime = (
    inRange( SECTION_ITS_BEGINNING - 4.0 beat, SECTION_AAAAA - 32.0 beat, rawTime ) ?
    1E9 :
    hihatTime
  );

  // -- end --------------------------------------------------------------------
  return aTime;
}

void calcRhythms() {
  calcRhythms( mod( time, 16.0 beat ), time );
}
