// == uniforms =================================================================
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D samplerShadow;

// == struct: isect ============================================================
struct Isect {
  vec3 pos;
  vec3 nor;
  int mtl;
  vec4 props;
};

Isect getIsect( vec2 _uv ) {
  vec4 tex0 = texture2D( sampler0, _uv );
  vec4 tex1 = texture2D( sampler1, _uv );
  vec4 tex2 = texture2D( sampler2, _uv );

  Isect isect;
  isect.pos = tex0.xyz;
  isect.nor = tex1.xyz;
  isect.mtl = int( tex2.w );
  isect.props = vec4( tex2.xyz, fract( floor( tex2.w ) ) );

  return isect;
}

float getEdge( vec2 _uv ) {
  vec4 tex0 = texture2D( sampler0, _uv - vec2( 0.0, 0.0 ) / resolution );
  vec4 tex1 = texture2D( sampler1, _uv - vec2( 0.0, 0.0 ) / resolution );
  vec4 tex2 = texture2D( sampler2, _uv - vec2( 0.0, 0.0 ) / resolution );
  vec3 ray = tex0.xyz - cameraPos;
  vec3 rayDir = normalize( ray );
  float rayLen = length( ray );

  vec4 tex0x = texture2D( sampler0, _uv + vec2( 1.0, 0.0 ) / resolution );
  vec4 tex0y = texture2D( sampler0, _uv + vec2( 0.0, 1.0 ) / resolution );
  vec4 tex1x = texture2D( sampler1, _uv + vec2( 1.0, 0.0 ) / resolution );
  vec4 tex1y = texture2D( sampler1, _uv + vec2( 0.0, 1.0 ) / resolution );
  vec4 tex2x = texture2D( sampler2, _uv + vec2( 1.0, 0.0 ) / resolution );
  vec4 tex2y = texture2D( sampler2, _uv + vec2( 0.0, 1.0 ) / resolution );

  float validx = tex2.w == tex2x.w ? 1.0 : 0.0;
  float validy = tex2.w == tex2y.w ? 1.0 : 0.0;

  return (
    abs( dot( rayDir, tex0x.xyz ) - dot( rayDir, tex0.xyz ) ) / rayLen * validx +
    abs( dot( rayDir, tex0y.xyz ) - dot( rayDir, tex0.xyz ) ) / rayLen * validy +
    length( tex1x.xyz - tex1.xyz ) * validx +
    length( tex1y.xyz - tex1.xyz ) * validy
  );
}

// == shadow ===================================================================
float shadow( Isect _isect ) {
  vec3 lig = _isect.pos - lightPos;
  float d = max( 0.001, dot( -_isect.nor, normalize( lig ) ) );

  vec4 pl = matPL * matVL * vec4( _isect.pos, 1.0 );
  vec2 uv = pl.xy / pl.w * 0.5 + 0.5;

  float dc = calcDepthL( lig );
  float ret = 0.0;
  for ( int iy = -1; iy <= 1; iy ++ ) {
    for ( int ix = -1; ix <= 1; ix ++ ) {
      vec2 uv = uv + vec2( float( ix ), float ( iy ) ) * 1E-3;
      float proj = texture2D( samplerShadow, uv ).x;
      float bias = 0.001 + ( 1.0 - d ) * 0.003;

      float dif = mix(
        smoothstep( bias * 2.0, bias, abs( dc - proj ) ),
        1.0,
        smoothstep( 0.4, 0.5, max( abs( uv.x - 0.5 ), abs( uv.y - 0.5 ) ) )
      );
      ret += dif / 9.0;
    }
  }
  return ret;
}

// == do shading ===============================================================
vec3 radiance( Isect _isect, vec3 dif, vec3 spe, float rough ) {
  // Ref: https://www.shadertoy.com/view/lsXSz7

  // calc a bunch of vectors
  vec3 ligDir = normalize( _isect.pos - lightPos );
  vec3 viewDir = normalize( _isect.pos - cameraPos );
  vec3 halfDir = normalize( ligDir + viewDir );

  float dotLig = max( 0.001, dot( -_isect.nor, ligDir ) );
  float dotView = max( 0.001, dot( -_isect.nor, viewDir ) );
  float dotHalf = max( 0.001, dot( -_isect.nor, halfDir ) );
  float dotHalfView = max( 0.001, dot( halfDir, viewDir ) );

  // Cook-Torrance
  float G = min( 1.0, 2.0 * dotHalf * min( dotView, dotLig ) / dotHalfView );

  // Beckmann
  float sqDotHalf = dotHalf * dotHalf;
  float sqDotHalfRough = sqDotHalf * rough * rough;
  float D = exp( ( sqDotHalf - 1.0 ) / sqDotHalfRough ) / ( sqDotHalf * sqDotHalfRough );

  // Fresnel
  vec3 Fspe = spe + ( 1.0 - spe ) * pow( 1.0 - dotHalfView, 5.0 );
  vec3 Fdif = spe + ( 1.0 - spe ) * pow( 1.0 - dotLig, 5.0 );

  // BRDF
  vec3 brdfSpe = Fspe * D * G / ( dotView * dotLig * 4.0 );
  vec3 brdfDif = dif * ( 1.0 - Fdif );

  // shadow
  float sh = mix( 0.6, 1.0, shadow( _isect ) );

  return ( brdfSpe + brdfDif ) * lightCol * dotLig * sh;
}

// == main =====================================================================
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  Isect isect = getIsect( uv );

  // if there are no normal, it's an air
  if ( length( isect.nor ) < 0.5 ) {
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    return;
  }

  vec3 thisColorIsCool = 0.2 + 0.8 * catColor(
    3.0 + smoothstep( -5.0, 2.0, isect.pos.z )
  );

  // material
  vec3 col;
  if ( isect.mtl == 1 ) {
    col = radiance( isect, isect.props.xyz, vec3( 0.1 ), 0.2 );
  } else if ( isect.mtl == 2 ) {
    col = isect.props.xyz;
  } else if ( isect.mtl == 3 ) {
    col = radiance( isect, isect.props.xyz, vec3( 0.2 ), 0.2 );
    col += 2.4 * thisColorIsCool * smoothstep( 0.03, 0.2, getEdge( uv ) );
  } else if ( isect.mtl == 4 ) {
    col = isect.props.x * thisColorIsCool;
  }

  gl_FragColor = vec4( col, 1.0 );
}