#extension GL_EXT_frag_depth : require
#extension GL_EXT_draw_buffers : require

#define TRACE_ITER 1
#define MARCH_MUL 0.8
#define MARCH_ITER 60
#define RAYLEN_INIT 0.01
#define INTERSECT_MIN 0.01
#define MARCH_FAR 20.0
#define FOV 90.0

uniform bool isShadow;
uniform vec4 ifsParams;

// ------

struct Camera {
  vec3 pos;
  vec3 dir;
  vec3 sid;
  vec3 top;
  float fov;
};

struct Ray {
  vec3 dir;
  vec3 ori;
};

// ------

Camera camInit( in vec3 _pos, in vec3 _tar, in float _rot, in float _fov ) {
  Camera cam;
  cam.pos = _pos;
  cam.dir = normalize( _tar - _pos );
  cam.sid = normalize( cross( cam.dir, vec3( 0.0, 1.0, 0.0 ) ) );
  cam.top = normalize( cross( cam.sid, cam.dir ) );
  cam.sid = cos( _rot ) * cam.sid + sin( _rot ) * cam.top;
  cam.top = normalize( cross( cam.sid, cam.dir ) );
  cam.fov = _fov;

  return cam;
}

Ray rayInit( in vec3 _ori, in vec3 _dir ) {
  Ray ray;
  ray.dir = _dir;
  ray.ori = _ori;
  return ray;
}

Ray rayFromCam( in vec2 _p, in Camera _cam ) {
  vec3 dir = normalize(
    _p.x * _cam.sid
    + _p.y * _cam.top
    + _cam.dir / tan( _cam.fov * PI / 360.0 ) // Is this correct?
  );
  return rayInit( _cam.pos, dir );
}

// ------

float distBox( vec3 _p, vec3 _s ) {
  vec3 d = abs( _p ) - _s;
  return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) );
}

vec3 typeIfs( vec3 _p, vec3 _rot, vec3 _shift ) {
  vec3 pos = _p;

  vec3 shift = _shift;

  for ( int i = 0; i < 5; i ++ ) {
    float intensity = pow( 2.0, -float( i ) );

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

float distFunc( vec3 _p, out vec4 mtl ) {
  float dist = 1E9;

  vec3 p = _p - vec3( 0.0, 0.0, zOffset.x );

  {
    vec3 p = mod( p, 2.0 ) - 1.0;
    float ch = min( distBox( p, vec3( 0.1, 0.01, 0.01 ) ), distBox( p, vec3( 0.01, 0.1, 0.01 ) ) );

    mtl = ch < dist ? vec4( 0.8, 0.8, 0.8, 1.0 ) : mtl;
    dist = ch < dist ? ch : dist;
  }


  if ( 224.0 beat < time ) {
    vec3 p = p;
    p.z = mod( p.z - 2.5, 5.0 ) - 2.5;
    p = typeIfs( p, vec3( -0.01, 0.06, -0.01 ), vec3( ifsParams.x * 4.8, ifsParams.x * 6.8, 4.8 ) );
    float ch = 1.8 * distBox( p / 1.8, vec3( ifsParams.y * 0.2 ) );

    mtl = ch < dist ? vec4( 0.02, 0.05, 0.08, 3.0 ) : mtl;
    dist = ch < dist ? ch : dist;
  }

  if ( 224.0 beat < time ) {
    vec3 p = p;
    p.z = mod( p.z - 1.0, 2.0 ) - 1.0;
    p = typeIfs( p, vec3( 0.02, -0.13, 0.01 ), vec3( ifsParams.x * 11.4, ifsParams.x * 4.8, 5.1 ) );
    float ch = distBox( p, vec3( ifsParams.y * 0.4 ) );

    mtl = ch < dist ? vec4( 0.02, 0.05, 0.08, 3.0 ) : mtl;
    dist = ch < dist ? ch : dist;
  }

  return dist;
}

float distFunc( vec3 _p ) {
  vec4 dummy;
  return distFunc( _p, dummy );
}

vec3 normalFunc( in vec3 _p, in float _d ) {
  vec2 d = vec2( 0.0, _d );
  return normalize( vec3(
    distFunc( _p + d.yxx ) - distFunc( _p - d.yxx ),
    distFunc( _p + d.xyx ) - distFunc( _p - d.xyx ),
    distFunc( _p + d.xxy ) - distFunc( _p - d.xxy )
  ) );
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  Camera cam = camInit(
    isShadow ? lightPos : cameraPos,
    cameraTar,
    isShadow ? 0.0 : cameraRoll,
    perspFov
  );
  Ray ray = rayFromCam( p, cam );

  float rayLen = RAYLEN_INIT;
  vec3 rayPos = ray.ori + ray.dir * rayLen;
  vec4 mtl;

  float dist;
  for ( int iMarch = 0; iMarch < MARCH_ITER; iMarch ++ ) {
    dist = distFunc( rayPos, mtl );
    rayLen += dist * MARCH_MUL;
    rayPos = ray.ori + ray.dir * rayLen;

    if ( abs( dist ) < INTERSECT_MIN ) { break; }
    if ( MARCH_FAR < dist ) { break; }
  }

  vec3 normal = vec3( 0.0 );
  if ( abs( dist ) < INTERSECT_MIN ) {
    normal = normalFunc( rayPos, 1E-4 );

    float z = dot( normalize( cameraTar - cam.pos ), rayPos - cam.pos );
    float a = ( perspFar + perspNear ) / ( perspFar - perspNear );
    float b = 2.0 * perspFar * perspNear / ( perspFar - perspNear );
    gl_FragDepthEXT = 0.5 + 0.5 * ( a - b / z );
  } else {
    gl_FragDepthEXT = 1.0;
  }

  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( rayPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  gl_FragData[ 0 ] = vec4( rayPos, 1.0 );
  gl_FragData[ 1 ] = vec4( normal, 1.0 );
  gl_FragData[ 2 ] = mtl;
}