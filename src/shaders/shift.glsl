
#define TAU 6.283185307
#define HUGE 9E16
#define BPM 175.0
#define FOV 70.0

#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define saturateA(i) clamp(i,0.,1.)
#define b2t(i) ((i)/BPM*60.0)
#define noten(i) 440.0*pow(2.0,(float(i)+trans)/12.0)
#define lofi(i,j) floor((i)/j)*j
#define iff(i) for(int _=0;_<1;_++){if(!(i)){break;} 
#define endiff }

#define INIT_LEN 1E-3
#define MARCH_ITER 100
// #define REFLECT_ITER 3

#define BLOOM_SAMPLES 20

#define MTL_AIR 0
#define MTL_IFS 1
#define MTL_MIRROR 2
#define MTL_PARTICLE 3

#extension GL_EXT_draw_buffers : require

precision highp float;

uniform bool init;
uniform bool isVert;
uniform float anotherShader;
uniform float anotherShaderEdge;
uniform float anotherShaderDif;
uniform float bufferTime;
uniform float bufferSize;
uniform float cameraRoll;
uniform float distFuncMode;
uniform float sampleRate;
uniform float time;
uniform float deltaTime;
uniform float gaussVar;
uniform float sphereLofi;
uniform float sphereBeat;
uniform float particleCountSqrt;
uniform float charCubeCountSqrt;
uniform float particleSize;
uniform float particleGravity;
uniform float particleField;
uniform float particleGenSize;
uniform float sphereSize;
uniform float randomyGlitch;
uniform float finalGlitch;
uniform vec2 resolution;
uniform vec2 textureModelReso;
uniform vec3 cameraPos;
uniform vec3 cameraTar;
uniform vec3 shiftPos;
uniform vec3 shiftRot;
uniform vec3 shiftSize;
uniform vec3 particlePos;
uniform vec3 spherePos;
uniform sampler2D texture;
uniform sampler2D textureModel;
uniform sampler2D textureBloom;
uniform sampler2D textureRender;
uniform sampler2D textureRandom;
uniform sampler2D textureRenderPos;
uniform sampler2D textureRenderIll;
uniform sampler2D textureParticlePos;
uniform sampler2D textureParticleNor;
uniform sampler2D textureParticleParam;
uniform sampler2D textureParticleIllumination;
uniform sampler2D textureCharCube;
uniform sampler2D textureP0;
uniform sampler2D textureP1;
uniform sampler2D textureP2;
uniform sampler2D textureP3;

// ------

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

float gaussian( float _x, float _v ) {
  return 1.0 / sqrt( 2.0 * PI * _v ) * exp( - _x * _x / 2.0 / _v );
}

float tri( float _phase ) {
  float p = mod( _phase, 2.0 );
  return p < 1.0 ? ( p ) : ( 2.0 - p );
}

float smin( float _a, float _b, float _k ){
  float h = clamp( 0.5 + 0.5 * ( _b - _a ) / _k, 0.0, 1.0 );
  return mix( _b, _a, h ) - _k * h * ( 1.0 - h );
}

vec4 random2D( vec2 _v ) {
  return fract( sin( texture2D( textureRandom, _v ) * 25711.34 ) * 175.23 );
}

vec4 random( float _v ) {
  return random2D( _v * V.yy );
}

// ------

mat4 lookAt( vec3 _pos, vec3 _tar, float _roll ) {
  vec3 dir = normalize( _tar - _pos );
  vec3 sid = normalize( cross( dir, V.xyx ) );
  vec3 top = normalize( cross( sid, dir ) );

  vec3 tempSid = sid;
  sid = cos( _roll ) * tempSid - sin( _roll ) * top;
  top = sin( _roll ) * tempSid + cos( _roll ) * top;

  return mat4(
    sid.x, top.x, dir.x, 0.0,
    sid.y, top.y, dir.y, 0.0,
    sid.z, top.z, dir.z, 0.0,
    - sid.x * _pos.x - sid.y * _pos.y - sid.z * _pos.z,
    - top.x * _pos.x - top.y * _pos.y - top.z * _pos.z,
    - dir.x * _pos.x - dir.y * _pos.y - dir.z * _pos.z,
    1.0
  );
}

mat4 perspective( float _fov, float _aspect, float _near, float _far ) {
  float p = 1.0 / tan( _fov * PI / 180.0 / 2.0 );
  float d = _far / ( _far - _near );
  return mat4(
    p / _aspect, 0.0, 0.0, 0.0,
    0.0, p, 0.0, 0.0,
    0.0, 0.0, d, 1.0,
    0.0, 0.0, -_near * d, 0.0
  );
}

// ------

struct Camera {
  vec3 pos;
  vec3 dir;
  vec3 sid;
  vec3 top;
};

struct Ray {
  vec3 dir;
  vec3 ori;
  int mtl;
};

struct Intersection {
  Ray ray;
  float len;
  vec3 pos;
  vec3 normal;
  int mtl;
  vec4 props;
};

// ------

Camera camInit( in vec3 _pos, in vec3 _tar, in float _roll ) {
  Camera cam;
  cam.pos = _pos;
  cam.dir = normalize( _tar - _pos );
  cam.sid = normalize( cross( cam.dir, V.xyx ) );
  cam.top = normalize( cross( cam.sid, cam.dir ) );
  vec3 tempSid = cam.sid;
  cam.sid = tempSid * cos( _roll ) - cam.top * sin( _roll );
  cam.top = tempSid * sin( _roll ) + cam.top * cos( _roll );

  return cam;
}

Ray rayInit( in vec3 _ori, in vec3 _dir, in int _mtl ) {
  Ray ray;
  ray.dir = _dir;
  ray.ori = _ori + _dir * INIT_LEN;
  ray.mtl = _mtl;
  return ray;
}

Ray rayFromCam( in vec2 _p, in Camera _cam, in float _fov ) {
  vec3 dir = normalize(
    _p.x * _cam.sid
    + _p.y * _cam.top
    + _cam.dir / tan( _fov * PI / 360.0 )
  );
  return rayInit( _cam.pos, dir, MTL_AIR );
}

Intersection interInit( in Ray _ray, in float _len, in vec3 _nor ) {
  Intersection inter;
  inter.ray = _ray;
  inter.len = _len;
  inter.pos = _ray.ori + _ray.dir * inter.len;
  inter.normal = _nor;
  inter.mtl = MTL_AIR;
  inter.props = V.xxxx;
  return inter;
}

Intersection applyIntersection( in Intersection _old, in Intersection _new ) {
  Intersection inter = _old;
  inter.len = _new.len;
  inter.pos = inter.ray.ori + inter.ray.dir * inter.len;
  inter.normal = _new.normal;
  inter.mtl = _new.mtl;
  inter.props = _new.props;
  return inter;
}

// ------

Intersection model( in Ray _ray, in sampler2D _model, in vec2 _reso, in vec3 _lofi ) {
  float minLen = HUGE;
  vec3 minNor = V.xxy;
  float edge = 1E9;

  float pos = 0.0;

  for ( int i = 0; i < 1000; i ++ ) {
    vec2 coord = vec2( mod( pos, 256.0 ) * 3.0, floor( pos / 256.0 ) ) + vec2( 0.5 );
    vec4 tex1 = texture2D( _model, ( V.yx * 0.0 + coord ) / _reso );
    vec4 tex2 = texture2D( _model, ( V.yx * 1.0 + coord ) / _reso );
    vec4 tex3 = texture2D( _model, ( V.yx * 2.0 + coord ) / _reso );
    tex1.xyz = floor( tex1.xyz / _lofi + 0.5 ) * _lofi;
    tex2.xyz = floor( tex2.xyz / _lofi + 0.5 ) * _lofi;
    tex3.xyz = floor( tex3.xyz / _lofi + 0.5 ) * _lofi;

    if ( tex1.w == 0.0 ) {
      float len1 = ( _ray.ori.x - tex1.x ) / _ray.dir.x; 
      float len2 = ( _ray.ori.x - tex2.x ) / _ray.dir.x;
      float lenMin = min( len1, len2 );
      float lenMax = max( len1, len2 );

      len1 = ( _ray.ori.y - tex1.y ) / _ray.dir.y; 
      len2 = ( _ray.ori.y - tex2.y ) / _ray.dir.y;
      lenMin = max( lenMin, min( len1, len2 ) );
      lenMax = min( lenMax, max( len1, len2 ) );

      len1 = ( _ray.ori.z - tex1.z ) / _ray.dir.z; 
      len2 = ( _ray.ori.z - tex2.z ) / _ray.dir.z;
      lenMin = max( lenMin, min( len1, len2 ) );
      lenMax = min( lenMax, max( len1, len2 ) );

      if ( lenMin <= lenMax ) {
        pos += 1.0;
      } else {
        pos += tex2.w;
      }
    } else if ( tex1.w == 1.0 ) {
      vec3 v1 = tex2.xyz - tex1.xyz;
      vec3 v2 = tex3.xyz - tex1.xyz;
      vec3 nor = normalize( cross( v1, v2 ) );
      nor = ( 0.0 < dot( nor, _ray.dir ) ) ? -nor : nor;

      float len = ( dot( nor, _ray.ori ) - dot( nor, tex1.xyz ) ) / dot( -nor, _ray.dir );
      if ( 0.0 < len && len < minLen ) {
        vec3 pos = _ray.ori + _ray.dir * len;
        vec3 c1 = cross( pos - tex1.xyz, tex2.xyz - tex1.xyz );
        vec3 c2 = cross( pos - tex2.xyz, tex3.xyz - tex2.xyz );
        vec3 c3 = cross( pos - tex3.xyz, tex1.xyz - tex3.xyz );
        float tedge = min(
          min(
            dot( normalize( cross( nor, tex2.xyz - tex1.xyz ) ), pos - tex1.xyz ),
            dot( normalize( cross( nor, tex3.xyz - tex2.xyz ) ), pos - tex2.xyz )
          ),
          dot( normalize( cross( nor, tex1.xyz - tex3.xyz ) ), pos - tex3.xyz )
        );
        if ( 0.0 < dot( c1, c2 ) && 0.0 < dot( c2, c3 ) ) {
          minLen = len;
          minNor = nor;
          edge = tedge;
        }
      }

      pos += 1.0;
    } else {
      break;
    }
  }

  Intersection inter = interInit( _ray, minLen, minNor );
  inter.props.w = smoothstep( 0.01, 0.001, edge );
  return inter;
}

// ------

float distFuncSphere( vec3 _p, float _r ) {
  return length( _p ) - _r;
}

float distFuncBox( vec3 _p, vec3 _s ) {
  vec3 d = abs( _p ) - _s;
  return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) );
}

float distFuncTorus( vec3 _p, vec2 _r ) {
  vec2 q = vec2( length( _p.xz ) - _r.x, _p.y );
  return length( q ) - _r.y;
}

float distFuncSlasher( vec3 _p, float _ratio ) {
  float phase = ( _p.x + _p.y );
  float slash = abs( 0.5 - ( phase - floor( phase ) ) ) * 2.0;
  return ( slash - _ratio ) / sqrt( 2.0 );
}

vec3 distFuncMandelbulb( vec3 _p, float _power, int _iter ) {
	vec3 p = _p.xzy;
	vec3 z = p;
	float dr = 1.0;
	float r = 0.0;
	float power = _power;
	float bailout = 2.0;

	float t0 = 1.0;

	for( int i = 0; i < 20; i ++ ) {
	    if ( _iter == i ) { break; }
	    
		r = length( z );
		if( bailout < r ) { break; }
		
		float theta = atan( z.y / z.x );
		float phi = asin( z.z / r );
		dr = pow( r, power - 1.0 ) * dr * power + 1.0;

		r = pow( r, power );
		theta = theta * power;
		phi = phi * power;

		z = r * vec3(
		    cos( theta ) * cos( phi ),
		    sin( theta ) * cos( phi ),
		    sin( phi )
		) + p;

		t0 = min( t0, r );
	}
	return vec3( 0.5 * log( r ) * r / dr, t0, 0.0 );
}

vec3 ifs( vec3 _p, vec3 _rot, vec3 _shift ) {
  vec3 pos = _p;

  vec3 shift = _shift;

  for ( int i = 0; i < 5; i ++ ) {
    float intensity = pow( 2.0, -float( i ) );

    pos.y -= 0.0;

    pos = abs( pos ) - shift * intensity;

    shift.yz = rotate2D( _rot.x ) * shift.yz;
    shift.zx = rotate2D( _rot.y ) * shift.zx;
    shift.xy = rotate2D( _rot.z ) * shift.xy;

    if ( pos.x < pos.y ) { pos.xy = pos.yx; }
    if ( pos.x < pos.z ) { pos.xz = pos.zx; }
    if ( pos.y < pos.z ) { pos.yz = pos.zy; }
  }

  return pos;
}

float distFunc( vec3 _p, float _time, out int mtl, out vec4 props ) {
  float dist = HUGE;
  mtl = MTL_AIR;
  props = V.xxxx;

  {
    vec3 p = mod( _p - 10.0, 20.0 ) - 10.0;
    p = ifs(
      p,
      shiftRot,
      shiftPos
    );
    float cdist = distFuncBox( p, shiftSize );

    if ( cdist < dist ) {
      dist = cdist;
      mtl = MTL_IFS;
      props = V.xxxx;
    }
  }

  {
    vec3 p = _p;
    p.yz = rotate2D( time * 2.3 ) * p.yz;
    p.zx = rotate2D( time * 0.7 ) * p.zx;

    float dist0 = distFuncSphere( p, 0.0 );
    float dist1 = distFuncSphere( p, 0.0 );

    if ( abs( distFuncMode - 1.0 ) < 1.0 ) {
      dist1 = distFuncBox( p, V.yyy * 0.4 );
    }

    if ( abs( distFuncMode - 2.0 ) < 1.0 ) {
      dist0 = distFuncTorus( p, vec2( 0.5, 0.2 ) );
    }

    if ( abs( distFuncMode - 3.0 ) < 1.0 ) {
      for ( int i = 1; i < 6; i ++ ) {
        dist1 = smin( dist1, distFuncSphere( p - vec3(
          sin( random2D( V.yy * float( i ) * 0.128 + 0.34 ).xyz * _time * 4.0 + random2D( V.yy * ( float( i ) * 0.45 + 4.5 ) ).xyz )
        ) * 0.4, 0.3 ), 0.2 );
      }
    }

    if ( abs( distFuncMode - 4.0 ) < 1.0 ) {
      dist0 = distFuncMandelbulb( p * 1.6, 8.0, 4 ).x / 1.6;
    }

    float cdist = mix( dist0, dist1, tri( distFuncMode ) );

    if ( cdist < dist ) {
      dist = cdist;
      mtl = MTL_MIRROR;
      props = V.xxxx;
    }
  }

  return dist;
}

float distFunc( vec3 _p, float _time ) {
  int mtl;
  vec4 props;
  return distFunc( _p, _time, mtl, props );
}

float distFunc( vec3 _p ) {
  return distFunc( _p, time );
}

vec3 normalFunc( in vec3 _p, in float _d ) {
  vec3 d = V * _d;
  return normalize( vec3(
    distFunc( _p + d.yxx ) - distFunc( _p - d.yxx ),
    distFunc( _p + d.xyx ) - distFunc( _p - d.xyx ),
    distFunc( _p + d.xxy ) - distFunc( _p - d.xxy )
  ) );
}

Intersection march( Ray _ray ) {
  float rayLen = INIT_LEN;
  vec3 rayPos = _ray.ori + rayLen * _ray.dir;
  float rayDist = 0.0;

  int mtl;
  vec4 props;

  for ( int iMarch = 0; iMarch < MARCH_ITER; iMarch ++ ) {
    rayDist = distFunc( rayPos, time, mtl, props );
    rayLen += rayDist * 0.8;
    rayPos = _ray.ori + rayLen * _ray.dir;
  }

  vec3 nor = normalFunc( rayPos, 1E-4 );
  float edge = exp( -rayLen * 0.1 ) * smoothstep( 0.1, 0.4, length( nor - normalFunc( rayPos, 1E-2 ) ) );
  Intersection inter = interInit( _ray, rayLen, nor );

  if ( rayDist < 1E-2 ) {
    inter.mtl = mtl;
    inter.props = vec4( props.xyz, edge );
  } else {
    inter.mtl = MTL_AIR;
  }

  return inter;
}

// ------

Intersection trace( Ray _ray ) {
  Intersection inter = march( _ray );

  iff ( 0.0 < sphereSize )
    float beat = time * BPM / 60.0;
    float kickTime = mod( beat, 4.0 ) < 2.5 ? b2t( mod( mod( beat, 4.0 ), 1.75 ) ) : b2t( mod( beat - 2.5, 4.0 ) );

    float scale = sphereSize * ( 1.0 + sphereBeat * sin( exp( -kickTime * 8.0 ) * PI ) );
    float rotX = time;
    float rotY = time;

    Ray ray = _ray;
    ray.ori -= spherePos;
    ray.ori /= scale;
    ray.ori.yz = rotate2D( -rotX ) * ray.ori.yz;
    ray.dir.yz = rotate2D( -rotX ) * ray.dir.yz;
    ray.ori.zx = rotate2D( -rotY ) * ray.ori.zx;
    ray.dir.zx = rotate2D( -rotY ) * ray.dir.zx;

    Intersection interModel = model( ray, textureModel, textureModelReso, V.yyy * max( 1E-4, sphereLofi ) );
    interModel.len *= interModel.len == HUGE ? 1.0 : scale;
    
    iff ( interModel.len < inter.len )
      inter = applyIntersection( inter, interModel );
      inter.normal.zx = rotate2D( rotY ) * inter.normal.zx;
      inter.normal.yz = rotate2D( rotX ) * inter.normal.yz;
      inter.mtl = MTL_IFS;
      inter.props.x = 1.0;
    endiff
  endiff

  return inter;
}

Intersection traceParticle( Ray _ray, vec2 _uv ) {
  Intersection inter = interInit( _ray, HUGE, V.xxy );
  
  vec3 pPos = texture2D( textureParticlePos, _uv ).xyz;
  vec3 pNor = texture2D( textureParticleNor, _uv ).xyz;
  vec3 pParam = texture2D( textureParticleParam, _uv ).xyz;
  float pSize = pParam.x;

  float len = length( pPos - cameraPos );

  iff ( pSize != 0.0 )
    inter = interInit( _ray, len, pNor );
    inter.mtl = MTL_PARTICLE;
    inter.props = vec4( pSize, V.xx, 1.0 );
  endiff

  return inter;
}

Intersection traceParticleSS( Ray _ray ) {
  mat4 matP = perspective( FOV, resolution.x / resolution.y, 0.01, 100.0 );
  mat4 matV = lookAt( cameraPos, cameraTar, cameraRoll );

  Intersection inter = interInit( _ray, HUGE, V.xxy );

  for ( int i = 0; i < 40; i ++ ) {
    float len = float( i ) * 0.01;
    vec3 pos = _ray.ori + len * _ray.dir;

    vec4 p = matP * matV * vec4( pos, 1.0 );
    vec2 uv = ( floor( ( p.xy / p.w * 0.5 + 0.5 ) * resolution ) + 0.5 ) / resolution;

    if ( 0.5 < abs( uv.x - 0.5 ) || 0.5 < abs( uv.y - 0.5 ) ) { break; }

    vec3 pPos = texture2D( textureParticlePos, uv ).xyz;
    vec3 pNor = texture2D( textureParticleNor, uv ).xyz;
    vec3 pParam = texture2D( textureParticleParam, uv ).xyz;
    float pSize = pParam.x;

    float lenDep = length( pPos - cameraPos );
    float lenRay = length( pos - cameraPos );
    iff ( pSize != 0.0 && lenDep < lenRay && ( lenRay - lenDep ) < pSize )
      inter = interInit( _ray, len, pNor );
      inter.mtl = MTL_PARTICLE;
      inter.props = vec4( pSize, V.xxx );
      break;
    endiff
  }

  return inter;
}

// ------

#ifdef _VQUAD
attribute vec2 p;

void main() {
  gl_Position = vec4( p, 0.0, 1.0 );
}
#endif

// ------

#ifdef _RETURN
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  gl_FragColor = texture2D( texture, uv );
}
#endif

// ------

#ifdef _PARTICLECOMPUTE
void main() {
  vec2 uv = gl_FragCoord.xy / particleCountSqrt;
  vec4 pos = texture2D( textureP0, uv );
  vec4 vel = texture2D( textureP1, uv );
  vec4 rot = texture2D( textureP2, uv );
  vec4 oth = texture2D( textureP3, uv );

  iff ( init || oth.x <= 0.0 )
    vec2 ruv = uv + pos.xy;

    pos = vec4( ( random2D( ruv ) * 2.0 - 1.0 ).xyz * particleGenSize, 1.0 );
    pos.xyz += particlePos;

    vel = ( random2D( ruv / 4.76 + 0.45 ) * 2.0 - 1.0 ) * 0.3;
    rot = random2D( ruv / 2.77 + 0.19 ) * 2.0 - 1.0;
    oth = init ? (
      random2D( ruv / 1.82 + 0.77 )
    ) : ( vec4(
      1.0,
      random2D( ruv / 1.82 + 0.77 ).yzw
    ) );
  endiff

  float size = sin( oth.x * PI ) * 0.02 * particleSize;
  float dist = distFunc( pos.xyz );
  vec3 nor = normalFunc( pos.xyz, 1E-3 );

  vel.xyz += (
    2.0 * ( texture2D( textureRandom, pos.xy * 0.01 ).xyz * 2.0 - 1.0 ) +
    0.5 * nor / max( 0.1, dist ) +
    ( sphereSize == 0.0 ? V.xxx : normalize( pos.xyz - spherePos ) / max( 0.1, length( pos.xyz - spherePos ) - sphereSize ) )
  ) * particleField * deltaTime;
  vel.y -= particleGravity * deltaTime;
  vel.xyz *= exp( -deltaTime );

  pos += vel * deltaTime;

  dist = distFunc( pos.xyz );
  nor = normalFunc( pos.xyz, 1E-3 );
  
  iff ( dist < size )
    float distP = distFunc( pos.xyz, time - 1E-3 );
    float distVel = ( dist - distP ) * 1E3;

    pos.xyz += nor * ( size - dist ) * 2.0;
    vel.xyz += nor * distVel;
    vel.xyz -= 1.4 * dot( vel.xyz, nor ) * nor;
  endiff

  rot.xy += rot.zw * 7.0 * deltaTime;

  oth.x -= 0.4 * deltaTime;
  oth.y = size;

  gl_FragData[ 0 ] = pos;
  gl_FragData[ 1 ] = vel;
  gl_FragData[ 2 ] = rot;
  gl_FragData[ 3 ] = oth;
}
#endif

// ------

#ifdef _VPARTICLERENDER
attribute vec3 attPos;
attribute vec3 attNor;
attribute float particleId;

varying vec3 vNor;
varying vec3 vPos;
varying vec3 vaPos;
varying float vSize;

void main() {
  vec2 uv = ( vec2(
    mod( particleId, particleCountSqrt ),
    floor( particleId / particleCountSqrt )
  ) + 0.5 ) / particleCountSqrt;
  vec4 pos = texture2D( textureP0, uv );
  vec4 vel = texture2D( textureP1, uv );
  vec4 rot = texture2D( textureP2, uv );
  vec4 oth = texture2D( textureP3, uv );

  mat4 matP = perspective( FOV, resolution.x / resolution.y, 0.01, 100.0 );
  mat4 matV = lookAt( cameraPos, cameraTar, cameraRoll );

  float size = oth.y;
  vSize = size;

  vec3 cp = size * attPos;
  cp.yz = rotate2D( rot.x ) * cp.yz;
  cp.zx = rotate2D( rot.y ) * cp.zx;
  pos.xyz += cp;

  vPos = pos.xyz;
  vaPos = attPos;
  vec4 outPos = matP * matV * vec4( pos.xyz, 1.0 );
  gl_Position = outPos;

  vNor = attNor;
  vNor.yz = rotate2D( rot.x ) * vNor.yz;
  vNor.zx = rotate2D( rot.y ) * vNor.zx;
}
#endif

// ------

#ifdef _PARTICLERENDER
varying vec3 vNor;
varying vec3 vPos;
varying vec3 vaPos;
varying float vSize;

uniform float particleKind;

void main() {
  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( vNor, 1.0 );
  gl_FragData[ 2 ] = vec4( vSize, 0.0, particleKind, 1.0 );
}
#endif

// ------

#ifdef _CHARCUBECOMPUTE
void main() {
  vec2 uv = gl_FragCoord.xy / charCubeCountSqrt;
  vec4 pos = texture2D( textureP0, uv );
  vec4 vel = texture2D( textureP1, uv );
  vec4 rot = texture2D( textureP2, uv );
  vec4 oth = texture2D( textureP3, uv );
  vec4 gen = texture2D( textureCharCube, uv );

  iff ( gen.w != 0.0 )
    pos = vec4( gen.xyz * 0.1, 1.0 );
    pos.xyz += particlePos;
    vec4 rnd = random2D( pos.xy / 2.44 );
    vel = vec4( rnd.xyz - 0.5, 1.0 );
    pos.xyz -= vel.xyz;
    rot = V.xxxy;
    oth = vec4( rnd.w * 0.2 + ( time * BPM / 60.0 < 64.0 ? 5.0 : 1.1 ), 0.0, 1.0, 1.0 );
  endiff

  float size = oth.x == 0.0 ? 0.0 : 0.04 * ( 1.0 - oth.z );

  vec3 d = vel.xyz * ( 1.0 - exp( -deltaTime * 6.0 ) );
  vel.xyz -= d;
  pos.xyz += d;

  oth.x = max( 0.0, oth.x - 1.0 * deltaTime );
  oth.y = size;
  oth.z *= exp( -deltaTime * 5.0 );

  gl_FragData[ 0 ] = pos;
  gl_FragData[ 1 ] = vel;
  gl_FragData[ 2 ] = rot;
  gl_FragData[ 3 ] = oth;
}
#endif

// ------

#ifdef _RENDER
vec3 colorAdd;
vec3 colorMul;
vec3 tempIll;

vec3 illInt( in Intersection inter ) {
  vec3 colDif = vec3( 0.0 );
  float reflective = 0.0;
  float illInt = 1.0;

  if ( inter.mtl == MTL_IFS ) {
    colDif = vec3( 0.2 );
    reflective = 0.5;

  } else if ( inter.mtl == MTL_MIRROR ) {
    colDif = vec3( 0.9 );
    reflective = 1.0;

  }

  colDif = mix( colDif, vec3( anotherShaderDif ), anotherShader );
  reflective = mix( reflective, 0.0, anotherShader );
  illInt = mix( illInt, 0.0, anotherShader );

  return illInt * ( 1.0 - reflective ) * colDif;
}

void shade( in vec2 uv, in Camera cam, in Intersection inter ) {
  if ( 0.5 < randomyGlitch ) {
    colorAdd = random( floor( inter.pos.y / 0.01 ) / 7.53 + time ).xyz * 0.7;
    colorMul *= 0.0;
    return;
  }

  vec3 camDir = normalize( inter.pos - cam.pos );
  vec3 ligPos = cam.pos;
  vec3 ligDir = normalize( inter.pos - ligPos );

  vec3 colDif = V.xxx;
  vec3 colEmi = V.xxx;
  vec3 colEdge = V.xxx;
  float reflective = 0.0;

  if ( inter.mtl == MTL_IFS ) {
    colDif = vec3( 0.2 );
    colEdge = vec3( 1.6, 0.1, 0.5 );
    colEdge *= inter.props.x == 1.0 ? 1.0 : 0.2 + 1.8 * exp( -mod( -length( inter.pos ) * 0.4 + time * 0.4, 1.0 ) * 5.0 );
    reflective = 0.5;

  } else if ( inter.mtl == MTL_MIRROR ) {
    colDif = vec3( 0.9 );
    reflective = 1.0;

  } else if ( inter.mtl == MTL_PARTICLE ) {
    colEmi = vec3( 0.6, 1.0, 1.5 );
    
  }

  colDif = mix( colDif, vec3( anotherShaderDif ), anotherShader );
  colEmi = mix( colEmi, vec3( 0.0 ), anotherShader );
  colEdge = mix( colEdge, vec3( inter.mtl == MTL_MIRROR ? 0.0 : anotherShaderEdge ), anotherShader );
  reflective = mix( reflective, 0.0, anotherShader );

  vec3 dif = V.yyy * ( 0.5 + 0.5 * dot( -inter.normal, ligDir ) );
  float spe = pow( max( 0.0, dot( normalize( camDir - inter.normal ), ligDir ) ), 40.0 );

  colorAdd += (
    dif * colDif * ( 1.0 - reflective ) +
    spe * 0.2 * reflective +
    inter.props.w * colEdge +
    colEmi
  ) * colorMul;
  colorMul *= dif * colDif * reflective;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  Camera cam = camInit( cameraPos, cameraTar, cameraRoll );
  Ray ray = rayFromCam( p, cam, FOV );

  colorAdd = V.xxx;
  colorMul = V.yyy;

  for ( int iRef = 0; iRef < REFLECT_ITER; iRef ++ ) {
    Intersection inter = trace( ray );
    iff ( iRef == 0 )
      gl_FragData[ 1 ] = vec4( inter.pos, 1.0 );
      gl_FragData[ 2 ] = vec4( illInt( inter ), 1.0 );

      Intersection interp = traceParticle( ray, uv );
      if ( interp.len < inter.len ) { inter = interp; }
    endiff

    iff ( iRef != 0 )
      Intersection interp = traceParticleSS( ray );
      if ( interp.len < inter.len ) { inter = interp; }
    endiff

    float fog = 1.0 - exp( -inter.len * 0.01 );
    colorAdd += fog * colorMul * vec3( 1.0, 2.0, 4.0 ) * ( 1.0 - anotherShader );
    colorMul *= ( 1.0 - fog );

    iff ( inter.mtl != MTL_AIR )
      shade( uv, cam, inter );
      ray = rayInit( inter.pos, reflect( ray.dir, inter.normal ), MTL_AIR );
    endiff

    iff ( inter.mtl == MTL_AIR )
      colorMul *= 0.0;
    endiff

    if ( length( colorMul ) < 0.01 ) { break; }
  }

  gl_FragData[ 0 ] = vec4( max( V.xxx, colorAdd ), 1.0 );
}
#endif

// ------

#ifdef _DOWNSCALE
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  vec4 sum = V.xxxx;
  float len = 1E9;
  for ( int iy = 0; iy < 4; iy ++ ) {
    for ( int ix = 0; ix < 4; ix ++ ) {
      vec2 p = uv + vec2( -1.5 + float( ix ), -1.5 + float( iy ) ) / resolution / 4.0;
      vec4 tex = texture2D( texture, p );

      sum += tex / 16.0;
    }
  }

  gl_FragColor = sum;
}
#endif

// ------

#ifdef _VPARTICLEILLUMINATION
attribute float particleId;

varying vec3 vPos;
varying float vSize;

void main() {
  vec2 uv = ( vec2(
    mod( particleId, particleCountSqrt ),
    floor( particleId / particleCountSqrt )
  ) + 0.5 ) / particleCountSqrt;
  vec4 pos = texture2D( textureP0, uv );
  vec4 vel = texture2D( textureP1, uv );
  vec4 rot = texture2D( textureP2, uv );
  vec4 oth = texture2D( textureP3, uv );

  float size = oth.y;
  vSize = size;

  mat4 matP = perspective( FOV, resolution.x / resolution.y, 0.01, 100.0 );
  mat4 matV = lookAt( cameraPos, cameraTar, cameraRoll );

  vPos = pos.xyz;
  vec4 outPos = matP * matV * vec4( pos.xyz, 1.0 );
  gl_Position = outPos;
  gl_PointSize = 128.0 / outPos.z;
}
#endif

// ------

#ifdef _PARTICLEILLUMINATION
varying vec3 vPos;
varying float vSize;

void main() {
  vec2 uv = ( floor( gl_FragCoord.xy / 0.25 ) + vec2( 0.5 ) ) / ( resolution / 0.25 );
  vec3 pos = texture2D( textureRenderPos, uv ).xyz;
  vec3 ill = texture2D( textureRenderIll, uv ).xyz;
  float len = length( pos - vPos );
  gl_FragColor = vec4( 0.3 * max( V.xxx, 10.0 / len / len * vSize * ill - 0.2 ) * vec3( 0.3, 0.6, 1.0 ), 1.0 );
}
#endif

// ------

#ifdef _BLOOM
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 bv = ( isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) ) / resolution;

  vec3 sum = V.xxx;
  for ( int i = -BLOOM_SAMPLES; i <= BLOOM_SAMPLES; i ++ ) {
    vec2 v = saturate( uv + bv * float( i ) );
    vec3 tex = texture2D( texture, v ).xyz;
    float mul = gaussian( abs( float( i ) ), gaussVar );
    sum += tex * mul;
  }

  gl_FragColor = vec4( sum, 1.0 );
}
#endif

// ------

#ifdef _POST
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float beat = time * BPM / 60.0 - 8.0;

  iff ( beat < 0.0 )
    vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;
    gl_FragColor = vec4( V.yyy * smoothstep( 0.0, 0.01, 0.3 * exp( -fract( beat ) ) - length( p ) ), 1.0 );
  endiff

  iff ( 0.0 <= beat )
    vec3 tex = texture2D( textureRender, uv ).xyz;
    tex += texture2D( textureParticleIllumination, uv ).xyz * 0.2;
    tex += max( V.xxx, texture2D( textureBloom, uv ).xyz - 0.7 ) * 0.4;
    tex = mix(
      vec3( 0.0 ),
      tex,
      1.14 - length( uv - 0.5 ) * 0.4 // vig
    );

    vec3 col = tex.xyz;
    col = vec3(
      smoothstep( 0.0, 1.0, col.x ),
      smoothstep( 0.0, 1.0, col.y ),
      smoothstep( -0.2, 1.2, col.z )
    );
    gl_FragColor = vec4( col, 1.0 );
  endiff
}
#endif

// ------

#ifdef _GLITCH
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 uvx = mod( uv.x + sin( TAU * random( floor( uv.y * 128.0 ) * 19.29 + time ).xyz ) * finalGlitch, V.yyy );
  float texInt = sin( time ) * 0.5 + 0.5;
  vec3 col = vec3(
    texture2D( texture, vec2( uvx.x, uv.y ) ).x,
    texture2D( texture, vec2( uvx.y, uv.y ) ).y,
    texture2D( texture, vec2( uvx.z, uv.y ) ).z
  );
  col *= 1.0 + finalGlitch * 10.0;
  gl_FragColor = vec4( col, 1.0 );
}
#endif

// ------

#ifdef _MUSIC
vec2 kick( float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  return V.yy * sin( _phase * 300.0 - exp( -_phase * 70.0 ) * 80.0 ) * exp( -_phase * 4.0 );
}

vec2 kick2( float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  return V.yy * sin( _phase * 300.0 - exp( -_phase * 100.0 ) * 30.0 ) * exp( -_phase * 5.0 );
}

vec2 snare( float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  return saturateA( (
    random( _phase / 0.034 ).xy +
    sin( _phase * 2500.0 * vec2( 1.005, 0.995 ) - exp( -_phase * 400.0 ) * 30.0 )
  ) * 2.0 * exp( -_phase * 23.0 ) );
}

vec2 snare2( float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  return (
    random( lofi( _phase, 6E-5 ) / 2.06 ).xy * 0.5 +
    sin( _phase * 2000.0 * vec2( 1.005, 0.995 ) - exp( -_phase * 800.0 ) * 20.0 )
  ) * exp( -_phase * 31.0 );
}

vec2 cowbell( float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 cow = (
    sin( _phase * 800.0 * TAU * vec2( 1.005, 0.995 ) - exp( -_phase * 800.0 ) * 20.0 ) +
    sin( _phase * 540.0 * TAU * vec2( 0.995, 1.005 ) - exp( -_phase * 800.0 ) * 20.0 )
  );
  return sign( cow ) * pow( abs( cow ) * exp( -_phase * 20.0 ), 0.8 * V.yy );
}

vec2 tam( float _freq, float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 s = V.yy * 2.0 * sin( _phase * _freq * TAU + random( _phase * 1.45 ).xy * 0.1 - exp( -_phase * 1000.0 ) * 9.0 );
  float a = exp( -_phase * 20.0 ) / 2.5;
  return s * a;
}

vec2 hihat( float _seed, float _dec ) {
  return random( _seed ).xy * exp( -_dec );
}

float powNoise( float _freq, float _phase ) {
  if ( _phase < 0.0 ) { return 0.0; }
  float p = mod( _phase * _freq, 1.0 ) + random( _phase * 1.45 ).x * 0.01;
  return ( ( p < 0.4 ? -0.1 : 0.1 ) + sin( p * TAU ) * 0.7 );
}

float sharpSaw( float _phase ) {
  return mod( _phase, 1.0 ) * 2.0 - 1.0;
}

float pwm( float _phase, float _pulse ) {
  return fract( _phase ) < _pulse ? -1.0 : 1.0;
}

float saw( float _freq, float _phase, float _filt, float _q ) {
  if ( _phase < 0.0 ) { return 0.0; }
  float sum = 0.0;
  for ( int i = 1; i <= 32; i ++ ) {
    float cut = smoothstep( _filt * 1.2, _filt * 0.8, float( i ) * _freq );
    cut += smoothstep( _filt * 0.3, 0.0, abs( _filt - float( i ) * _freq ) ) * _q;
    sum += sin( float( i ) * _freq * _phase * TAU ) / float( i ) * cut;
  }
  return sum;
}

vec2 fms( float _freq, float _phase, float _mod ) {
  if ( _phase < 0.0 ) { return V.xx; }
  float p = _phase * _freq * TAU;
  return vec2(
    sin( p * 0.999 + sin( p * _mod * 1.002 ) * exp( -_phase * 7.0 ) ),
    sin( p * 1.001 + sin( p * _mod * 0.998 ) * exp( -_phase * 7.0 ) )
  ) * exp( -_phase * 7.0 );
}

vec2 bell( float _freq, float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 p = _freq * vec2( 1.001, 0.999 ) * _phase * TAU;
  float d = exp( -_phase * 1.0 );
  float d2 = exp( -_phase * 20.0 );
  return (
    sin( p * 1.0001 + sin( p * 3.5004 ) * d ) +
    sin( p * 0.9998 + sin( p * 3.4997 ) * d ) +
    sin( _phase * 2033.2 + sin( p * 1.9994 ) * exp( -_phase * 10.0 ) ) * exp( -_phase * 10.0 )
  ) * 0.3 * d;
}

vec2 choir( float _freq, float _phase, float _time ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 sum = V.xx;
  for ( int i = 0; i < 6; i ++ ) {
    vec4 rand = random( float( i ) / 0.3 );
    vec2 p = ( _time - _phase ) + _phase * _freq * PI * ( 0.98 + 0.04 * rand.xy ) + float( i );
    p += sin( p / _freq * 3.0 + rand.zw );
    sum += sin( 2.0 * p + sin( p ) * 1.0 + sin( 7.0 * p ) * 0.02 );
  }
  return sum / 8.0;
}

vec2 cccp( float _freq, float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 p = _freq * vec2( 0.999, 1.001 ) * _phase * TAU;
  float dl = exp( -_phase * 1.0 );
  float ds = exp( -_phase * 10.0 );
  return (
    sin( p * 1.0003 + sin( p * 11.0035 ) * 1.5 * ds + sin( p * 1.0003 ) * 1.0 * dl ) +
    sin( p * 0.9997 + sin( p * 0.9997 + sin( p * 4.9984 ) * 2.0 * dl ) * 0.5 * ds )
  ) * 0.5 * ds;
}

vec2 bass( float _freq, float _phase ) {
  if ( _phase < 0.0 ) { return V.xx; }
  vec2 p = _freq * vec2( 0.999, 1.001 ) * _phase * TAU;
  float dl = exp( -_phase * 1.0 );
  float ds = exp( -_phase * 14.0 );
  return sin(
    p +
    sin( p ) * 1.5 * dl +
    sin( p + sin( p * 10.0 ) * 2.5 * ds ) * 3.0 * ds +
    sin( p + sin( p * 18.0 ) * 1.5 * ds ) * 0.5 * dl
  ) * 0.5 * dl;
}

void main() {
  float t = ( gl_FragCoord.x - 0.5 + resolution.x * ( gl_FragCoord.y - 0.5 ) ) / sampleRate;
  float beat = t * BPM / 60.0 - 8.0;
  vec2 ret = V.xx;
  float tenkai = floor( beat / 4.0 );
  float sidechain = 0.0;

  float trans = 3.0;

  float beati = floor( beat );
  float beatf = fract( beat );
  float beat32 = mod( beat, 32.0 );

  float kickTime;
  float snareTime;
  
  // ------

  iff ( beat < 0.0 )
    ret += 0.5 * sin( TAU * t * ( mod( beat, 4.0 ) < 1.0 ? 2000.0 : 1000.0 ) ) * ( beatf < 0.1 ? 1.0 : 0.0 );
  endiff

  // ------

  iff ( ( 0.0 < beat && beat < 64.0 ) || ( 192.0 < beat && beat < 256.0 ) )
    kickTime = b2t( mod( mod( beat, 4.0 ), 2.5 ) );
    snareTime = b2t( mod( beat - 1.0, 2.0 ) );
    float beat64 = mod( beat, 64.0 );

    ret += 0.7 * kick2( kickTime );
    ret += 0.5 * snare2( snareTime );
    sidechain = smoothstep( 0.0, 0.2, min( kickTime, snareTime ) );

    ret += 0.2 * sidechain * hihat( t, b2t( mod( beat, 0.5 ) ) * 100.0 );
    if ( 32.0 < beat ) {
      ret += 0.2 * hihat( t * 0.1, b2t( mod( beat, 0.25 ) ) * 1000.0 );
    }

    float build = max( 0.0, beat64 - 48.0 );
    float ksk = pow( build * 0.3, 2.0 );
    float vib = sin( t * ( 20.0 + ksk ) ) * ( 0.1 + ksk * 0.1 );
    ret += sidechain * sharpSaw( noten( -24 ) * t + vib ) * 0.04;
    ret += sidechain * sharpSaw( noten( -17 ) * t + vib ) * 0.04;
    ret += sidechain * sharpSaw( noten( -14 ) * t + vib ) * 0.04;
    ret += sidechain * sharpSaw( noten( -7 ) * t + vib ) * 0.04;
    ret += sidechain * sharpSaw( noten( 2 ) * t + vib ) * 0.04;

    ret += sidechain * 0.2 * build / 16.0 * random( lofi( t * 6.24, 0.0008 * lofi( build / 16.0, 0.02 ) ) ).xy;

    iff ( 62.5 < beat64 )
      ret = 0.7 * kick( b2t( beat64 - 62.5 ) );
      ret += 0.5 * snare( b2t( beat64 - 63.0 ) );
      if ( 255.0 < beat ) {
        ret = 0.5 * snare( b2t( beat - 255.0 - lofi( beat - 255.0, 0.08 ) * 0.8 ) );
      }
    endiff
  endiff

  // ------

  iff ( 64.0 < beat && beat < 192.0 )
    if ( 124.5 < beat && beat < 128.0 ) {
      ret += 0.7 * kick2( b2t(
        mod( mod( beatf - 0.75, 1.0 ), 0.75 )
      ) );
      ret += 0.5 * snare2( b2t(
        mod( mod( beatf - 0.25, 1.0 ), 0.75 )
      ) );
      if ( 127.0 < beat ) {
        ret = 0.5 * snare( b2t( beat - 127.0 - lofi( beat - 127.0, 0.12 ) * 0.6 ) );
      }
      sidechain = 0.0;
    } else {
      kickTime = mod( beat, 4.0 ) < 2.5 ? b2t( mod( mod( beat, 4.0 ), 1.75 ) ) : b2t( mod( beat - 2.5, 4.0 ) );
      snareTime = b2t( mod( beat - 1.0, 2.0 ) );

      ret += 0.7 * kick( kickTime );
      ret += 0.5 * snare( snareTime );
      sidechain = smoothstep( 0.0, 0.2, min( kickTime, snareTime ) );
    }

    ret += 0.4 * tam( 300.0, b2t( mod( beat - 0.75, 2.0 ) ) );

    if ( 96.0 < beat ) {
      ret += 0.3 * sidechain * hihat( t, b2t( mod( beat, 0.25 ) ) * 100.0 );
    }

    iff ( mod( beat, 2.0 ) < 1.0 )
      ret += sidechain * powNoise( noten( 0 ) / 8.0, t ) * 1.0;
    endiff
  endiff

  iff ( 256.0 < beat && beat < 448.0 )
    trans = beat < 320.0 ? 2.0 : beat < 384.0 ? 0.0 : -3.0;
    kickTime = mod( beat, 4.0 ) < 2.5 ? b2t( mod( mod( beat, 4.0 ), 1.75 ) ) : b2t( mod( beat - 2.5, 4.0 ) );
    snareTime = b2t( mod( beat - 1.0, 2.0 ) );

    if ( ( 316.0 < beat && beat < 320.0 ) || 444.0 < beat ) {
      sidechain = smoothstep( 0.0, 0.2, b2t( beatf ) );
    } else {
      ret += 0.7 * kick( kickTime );
      ret += 0.5 * snare( snareTime );
      sidechain = smoothstep( 0.0, 0.2, min( kickTime, snareTime ) );

      iff ( beat < 384.0 )
        ret += 0.4 * tam( 300.0, b2t( mod( beat - 0.75, 2.0 ) ) );
        ret += 0.3 * sidechain * hihat( t, b2t( mod( beat, 0.25 ) ) * 100.0 );
      endiff

      float vib = sin( t * 20.0 ) * 0.1;
      ret += sidechain * sharpSaw( noten( -24 ) * t + vib ) * 0.04;
      ret += sidechain * sharpSaw( noten( -17 ) * t + vib ) * 0.04;
      ret += sidechain * sharpSaw( noten( -14 ) * t + vib ) * 0.04;
      ret += sidechain * sharpSaw( noten( -7 ) * t + vib ) * 0.04;
      ret += sidechain * sharpSaw( noten( 2 ) * t + vib ) * 0.04;
    }

    iff ( mod( beat, 2.0 ) < 1.0 )
      ret += sidechain * powNoise( noten( 0 ) / 8.0, t ) * 1.0;
    endiff
  endiff

  // ------

  iff ( ( 256.0 < beat && beat < 448.0 ) )
    iff ( 1.25 < beat32 && beat32 < 2.0 )
      ret += saturateA( saw(
        noten( beatf < 0.5 ? 10 : beatf < 0.75 ? 12 : 0 ) / 4.0,
        b2t( mod( beat, 0.25 ) ),
        300.0 + 1200.0 * exp( -b2t( mod( beat, 0.25 ) ) * 20.0 ),
        7.0
      ) * 1.0 ) * 0.15;
    endiff

    iff ( 3.0 < beat32 && beat32 < 4.0 )    
      ret += bell( noten( -2 ), b2t( beatf - 0.75 ) ) * 0.2;
    endiff

    iff ( 5.0 < beat32 && beat32 < 6.0 )    
      ret += sidechain * sharpSaw( noten( 0 ) / 4.0 * t ) * 0.2;
    endiff

    iff ( 7.0 < beat32 && beat32 < 8.0 )
      ret += sidechain * sharpSaw( noten( 0 ) * t + sin( t * 50.0 ) * 0.4 ) * 0.15;
    endiff

    iff ( 9.0 < beat32 && beat32 < 10.0 )
      ret += 0.5 * tam( 200.0, b2t( beatf - 0.5 ) );
    endiff

    iff ( 11.0 < beat32 && beat32 < 12.0 )
      if ( 0.5 < beatf ) {
        ret += saw(
          noten( beatf < 0.75 ? 10 : 0 ) / 4.0,
          b2t( mod( beatf, 0.25 ) ),
          300.0 + 4500.0 * exp( -b2t( mod( beatf, 0.25 ) ) * 20.0 ),
          3.0
        ) * 0.08;
      }
    endiff

    iff ( 13.25 < beat32 && beat32 < 13.75 )
      float p = mod( noten( beatf < 0.5 ? -2 : 0 ) / 8.0 * b2t( beatf ), 1.0 );
      ret += 0.4 * exp( -1.0 * b2t( mod( beat, 0.25 ) ) ) * lofi( p < 0.5 ? p * 4.0 - 1.0 : 3.0 - p * 4.0, 0.1 );
    endiff
    
    iff ( 15.0 < beat32 && beat32 < 16.0 )
      ret += fms( noten( 0 ) / 2.0, b2t( beatf - 0.5 ), 2.0 ) * 0.1;
      ret += fms( noten( 5 ) / 2.0, b2t( beatf - 0.5 ), 7.0 ) * 0.1;
      ret += fms( noten( 7 ) / 2.0, b2t( beatf - 0.5 ), 1.0 ) * 0.1;
      ret += fms( noten( 10 ) / 2.0, b2t( beatf - 0.5 ), 12.0 ) * 0.1;
    endiff

    iff ( 17.0 < beat32 && beat32 < 18.0 )
      ret += 0.1 * sidechain * saw(
        noten( 0 ) / 8.0,
        lofi( b2t( beatf ), 2E-4 ),
        300.0 + 3500.0 * exp( -b2t( beatf ) * 10.0 ),
        7.0
      );
    endiff

    iff ( 19.0 < beat32 && beat32 < 20.0 )
      ret += 0.2 * sidechain * pwm( t * noten( -38 ), 0.5 );
    endiff

    iff ( 21.0 < beat32 && beat32 < 22.0 )
      ret += cccp( noten( 2 ), b2t( beatf - 0.25 ) ) * 0.1;
      ret += cccp( noten( 3 ), b2t( beatf - 0.5 ) ) * 0.1;
      ret += cccp( noten( 10 ), b2t( beatf - 0.75 ) ) * 0.1;
    endiff

    iff ( 23.0 < beat32 && beat32 < 24.0 )
      ret += cowbell( b2t( beatf - 0.5 ) ) * 0.2;
    endiff

    iff ( 25.25 < beat32 && beat32 < 25.75 )
      ret += 0.15 * bass( noten( beatf < 0.5 ? -26 : -24 ), b2t( mod( beatf, 0.25 ) ) );
    endiff

    iff ( 27.00 < beat32 && beat32 < 28.00 )
      ret += 0.15 * bass( noten( -26 ), b2t( lofi( beatf, 0.001 ) - 0.5 ) * 0.5 );
    endiff

    iff ( 29.0 < beat32 && beat32 < 30.0 )
      ret += 0.1 * sidechain * pwm( t * noten( -7 ), beatf * 0.5 );
    endiff

    iff ( 31.0 < beat32 && beat32 < 32.0 )
      int n = int( mod( floor( beatf * 12.0 ), 6.0 ) );
      ret += 0.1 * sidechain * pwm( t * noten( n == 0 ? 0 : n == 1 ? 5 : n == 2 ? 7 : n == 3 ? 12 : n == 4 ? 17 : 19 ), 0.25 );
    endiff
  endiff

  // ------

  iff ( 128.0 < beat && beat < 254.5 )
    for ( int i = 0; i < 3; i ++ ) {
      float dice = random( floor( ( beat - float( i ) * 0.75 ) / 0.25 ) / 4.72 ).x;
      int dicen = int( dice * 5.0 );
      float note = dicen == 0 ? 0.0 : dicen == 1 ? 7.0 : dicen == 2 ? 10.0 : dicen == 3 ? 17.0 : 26.0;
      float diceo = mod( floor( dice * 15.0 ), 3.0 );
      note += diceo * 12.0;
      ret += 0.07 / float( i * 4 + 1 ) * cccp( noten( note ) / 2.0, b2t( mod( beatf, 0.25 ) ) );
    }
  endiff

  iff ( 320.0 < beat && beat < 444.0 )
    for ( int i = 0; i < 3; i ++ ) {
      float dice = random( floor( ( beat - float( i ) ) / 0.25 ) / 4.72 ).x;
      int dicen = int( dice * 5.0 );
      float note = dicen == 0 ? 0.0 : dicen == 1 ? 7.0 : dicen == 2 ? 10.0 : dicen == 3 ? 17.0 : 26.0;
      float diceo = mod( floor( dice * 15.0 ), 3.0 );
      note += diceo * 12.0;
      float ph = b2t( mod( beatf, 0.25 ) );
      ret += 0.03 * saw( noten( note ) / 2.0, ph, 200.0 + 6500.0 * exp( -ph * 20.0 ) / float( i * 5 + 1 ), 0.0 );
    }
  endiff

  // ------

  gl_FragColor = vec4( ret, 0.0, 1.0 );
}
#endif