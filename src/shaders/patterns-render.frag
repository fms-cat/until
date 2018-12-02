#extension GL_EXT_draw_buffers : require

varying vec3 vPos;
varying vec3 vCol;
varying vec3 vRawPos;
varying float vLife;
varying float vMode;

uniform bool isShadow;

uniform sampler2D samplerShadow;

// == patterns =================================================================
bool ptn0( vec2 _p ) {
  float inner = pow( 1.0 - vLife, 2.0 );
  float outer = 1.0 - exp( -5.0 * ( 1.0 - vLife ) );
  vec2 p = _p;
  return inner < length( p ) && length( p ) < outer;
}

bool ptn1( vec2 _p ) {
  float inner = 0.7 * pow( 1.0 - vLife, 2.0 );
  float outer = 0.7 * ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) );
  vec2 p = _p * rotate2D( PI * ( 1.0 - exp( -2.0 * ( 1.0 - vLife ) ) ) );
  return (
    max( abs( p.x ), abs( p.y ) ) < outer &&
    inner < max( abs( p.x ), abs( p.y ) )
  );
}

bool ptn2( vec2 _p ) {
  float inner = 0.7 * pow( 1.0 - vLife, 2.0 );
  float outer = 0.7 * ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) );
  vec2 p = _p * rotate2D( PI / 4.0 );
  return (
    max( abs( p.x ), abs( p.y ) ) < outer &&
    inner < min( abs( p.x ), abs( p.y ) )
  );
}

bool ptn3( vec2 _p ) {
  float inner = 0.3 * ( 1.0 - pow( 1.0 - vLife, 2.0 ) );
  float outer = 0.3 * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  float radius = 0.7 * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  
  vec2 p = _p;
  p = rotate2D( -PI / 2.0 ) * p;
  p = rotate2D( -lofir( atan( p.y, p.x ), TAU / 6.0 ) ) * p;
  p.x -= radius * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  return (
    length( p ) < inner &&
    length( p ) < outer
  );
}

// == main procedure ===========================================================
void main() {
  if ( vLife <= 0.0 ) { discard; }

  // if ( 0.5 < length( gl_PointCoord - 0.5 ) ) { discard; }

  if ( isShadow ) {
    gl_FragData[ 0 ] = vec4( calcDepthL( vPos - lightPos ), 0.0, 0.0, 1.0 );
    return;
  }

  vec2 p = vRawPos.xy;
  bool b = false;

  if ( vMode < 0.5 ) {
    b = b || ptn0( p );

  } else if ( vMode < 1.5 ) {
    b = b || ptn1( p );

  } else if ( vMode < 2.5 ) {
    b = b || ptn2( p );

  } else {
    b = b || ptn3( p );

  }

  if ( !b ) { discard; }

  gl_FragData[ 0 ] = vec4( vPos, 1.0 );
  gl_FragData[ 1 ] = vec4( 0.0, 0.0, 1.0, 1.0 );
  gl_FragData[ 2 ] = vec4( 1.7, 0.9, 2.0, 4.0 );
}