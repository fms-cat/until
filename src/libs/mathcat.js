// にゃーん

const MathCat = {};

/**
 * Add two vecs.
 * @param {number[]} a vecN
 * @param {number[]} b vecN
 * @returns {number[]} vecN, `a + b`
 * @static
 */
MathCat.vecAdd = ( a, b ) => a.map( ( e, i ) => e + b[ i ] );

/**
 * Substract a vec from an another vec.
 * @param {number[]} a vecN
 * @param {number[]} b vecN
 * @returns {number[]} vecN, `a - b`
 * @static
 */
MathCat.vecSub = ( a, b ) => a.map( ( e, i ) => e - b[ i ] );


/**
 * Multiply two vecs.
 * @param {number[]} a vecN
 * @param {number[]} b vecN
 * @returns {number[]} vecN, `a * b`
 * @static
 */
MathCat.vecMul = ( a, b ) => a.map( ( e, i ) => e - b[ i ] );

/**
 * Return a cross of two vec3s.
 * @param {number[]} a vec3
 * @param {number[]} b vec3
 * @returns {number[]} vec3, cross product of `a` and `b`
 * @static
 */
MathCat.vec3Cross = ( a, b ) => [
  a[ 1 ] * b[ 2 ] - a[ 2 ] * b[ 1 ],
  a[ 2 ] * b[ 0 ] - a[ 0 ] * b[ 2 ],
  a[ 0 ] * b[ 1 ] - a[ 1 ] * b[ 0 ]
];

/**
 * Scale a vec by scalar.
 * @param {number} s scalar
 * @param {number[]} v vecN
 * @returns {number[]} vecN, `s * v`
 * @static
 */
MathCat.vecScale = ( s, v ) => v.map( ( e ) => e * s );

/**
 * Dot two vectors.
 * @param {number[]} a vecN
 * @param {number[]} b vecN
 * @returns {number[]} vecN, Dot of `a` and `b`
 * @static
 */
MathCat.vecDot = ( a, b ) => a.reduce( ( p, e, i ) => p + e * b[ i ], 0.0 );

/**
 * Return length of a vec.
 * @param {number[]} v vecN
 * @returns {number} scalar, length of `v`
 * @static
 */
MathCat.vecLength = ( v ) => Math.sqrt( v.reduce( ( p, c ) => p + c * c, 0.0 ) );

/**
 * Normalize a vec.
 * @param {number[]} v vecN
 * @returns {number[]} vec, normalized `v`
 * @static
 */
MathCat.vecNormalize = ( v ) => MathCat.vecScale( 1.0 / MathCat.vecLength( v ), v );

/**
 * Multiply two quats.
 * @param {number[]} q quat
 * @param {number[]} r quat
 * @returns {number[]} quat, product of `a` and `b`
 * @static
 */
MathCat.quatMul = ( q, r ) => [
  q[ 3 ] * r[ 0 ] + q[ 0 ] * r[ 3 ] + q[ 1 ] * r[ 2 ] - q[ 2 ] * r[ 1 ],
  q[ 3 ] * r[ 1 ] - q[ 0 ] * r[ 2 ] + q[ 1 ] * r[ 3 ] + q[ 2 ] * r[ 0 ],
  q[ 3 ] * r[ 2 ] + q[ 0 ] * r[ 1 ] - q[ 1 ] * r[ 0 ] + q[ 2 ] * r[ 3 ],
  q[ 3 ] * r[ 3 ] - q[ 0 ] * r[ 0 ] - q[ 1 ] * r[ 1 ] - q[ 2 ] * r[ 2 ]
];

/**
 * Inverse a quat.
 * @param {number[]} q quat
 * @returns {number[]} quat, `-q`
 * @static
 */
MathCat.quatInv = ( q ) => [ -q[ 0 ], -q[ 1 ], -q[ 2 ], q[ 3 ] ];

/**
 * Rotate a vec3 using one quat.
 * @param {number[]} v vec3
 * @param {number[]} q quat
 * @returns {number[]} vec3, rotated vector
 * @static
 */
MathCat.rotateVecByQuat = ( v, q ) => {
  const p = [ v[ 0 ], v[ 1 ], v[ 2 ], 0.0 ];
  const r = MathCat.quatInv( q );
  const res = MathCat.quatMul( MathCat.quatMul( q, p ), r );
  return [ res[ 0 ], res[ 1 ], res[ 2 ] ];
};

/**
 * Convert quat into mat4.
 * @param {number[]} q quat
 * @returns {number[]} mat4, rotation matrix made from quat
 * @static
 */
MathCat.quatToMat4 = ( q ) => {
  const x = MathCat.rotateVecByQuat( [ 1.0, 0.0, 0.0 ], q );
  const y = MathCat.rotateVecByQuat( [ 0.0, 1.0, 0.0 ], q );
  const z = MathCat.rotateVecByQuat( [ 0.0, 0.0, 1.0 ], q );

  return [
    x[ 0 ], y[ 0 ], z[ 0 ], 0.0,
    x[ 1 ], y[ 1 ], z[ 1 ], 0.0,
    x[ 2 ], y[ 2 ], z[ 2 ], 0.0,
    0.0, 0.0, 0.0, 1.0
  ];
};

/**
 * Generate quat from angle and axis.
 * @param {number} angle scalar, Rotation angle in radian
 * @param {number[]} axis vec3, Rotation axis
 * @returns {number[]} quat, Generated quaternion
 * @static
 */
MathCat.quatAngleAxis = ( angle, axis ) => {
  const ha = angle / 2.0;
  const sha = Math.sin( ha );
  return [
    axis[ 0 ] * sha,
    axis[ 1 ] * sha,
    axis[ 2 ] * sha,
    Math.cos( ha )
  ];
};

/**
 * Apply two mat4s.
 * @param {number[]} a mat4
 * @param {number[]} b mat4
 * @returns {number[]} mat4, Applied matrix
 * @static
 */
MathCat.mat4Apply = ( ...mat ) => {
  const a = mat[ 0 ];
  const b = mat[ 1 ];

  if ( 3 < mat.length ) {
    const m = mat.slice( 2 );
    return MathCat.mat4Apply( MathCat.mat4Apply( a, b ), ...m );
  }

  return [
    a[ 0 ] * b[ 0 ] + a[ 4 ] * b[ 1 ] + a[ 8 ] * b[ 2 ] + a[ 12 ] * b[ 3 ],
    a[ 1 ] * b[ 0 ] + a[ 5 ] * b[ 1 ] + a[ 9 ] * b[ 2 ] + a[ 13 ] * b[ 3 ],
    a[ 2 ] * b[ 0 ] + a[ 6 ] * b[ 1 ] + a[ 10 ] * b[ 2 ] + a[ 14 ] * b[ 3 ],
    a[ 3 ] * b[ 0 ] + a[ 7 ] * b[ 1 ] + a[ 11 ] * b[ 2 ] + a[ 15 ] * b[ 3 ],

    a[ 0 ] * b[ 4 ] + a[ 4 ] * b[ 5 ] + a[ 8 ] * b[ 6 ] + a[ 12 ] * b[ 7 ],
    a[ 1 ] * b[ 4 ] + a[ 5 ] * b[ 5 ] + a[ 9 ] * b[ 6 ] + a[ 13 ] * b[ 7 ],
    a[ 2 ] * b[ 4 ] + a[ 6 ] * b[ 5 ] + a[ 10 ] * b[ 6 ] + a[ 14 ] * b[ 7 ],
    a[ 3 ] * b[ 4 ] + a[ 7 ] * b[ 5 ] + a[ 11 ] * b[ 6 ] + a[ 15 ] * b[ 7 ],

    a[ 0 ] * b[ 8 ] + a[ 4 ] * b[ 9 ] + a[ 8 ] * b[ 10 ] + a[ 12 ] * b[ 11 ],
    a[ 1 ] * b[ 8 ] + a[ 5 ] * b[ 9 ] + a[ 9 ] * b[ 10 ] + a[ 13 ] * b[ 11 ],
    a[ 2 ] * b[ 8 ] + a[ 6 ] * b[ 9 ] + a[ 10 ] * b[ 10 ] + a[ 14 ] * b[ 11 ],
    a[ 3 ] * b[ 8 ] + a[ 7 ] * b[ 9 ] + a[ 11 ] * b[ 10 ] + a[ 15 ] * b[ 11 ],

    a[ 0 ] * b[ 12 ] + a[ 4 ] * b[ 13 ] + a[ 8 ] * b[ 14 ] + a[ 12 ] * b[ 15 ],
    a[ 1 ] * b[ 12 ] + a[ 5 ] * b[ 13 ] + a[ 9 ] * b[ 14 ] + a[ 13 ] * b[ 15 ],
    a[ 2 ] * b[ 12 ] + a[ 6 ] * b[ 13 ] + a[ 10 ] * b[ 14 ] + a[ 14 ] * b[ 15 ],
    a[ 3 ] * b[ 12 ] + a[ 7 ] * b[ 13 ] + a[ 11 ] * b[ 14 ] + a[ 15 ] * b[ 15 ]
  ];
};

/**
 * Invert a mat4.
 * @param {number[]} m mat4
 * @returns {number[]} mat4, Inverted matrix
 * @static
 */
MathCat.mat4Inverse = ( m ) => {
  const
    a00 = m[  0 ], a01 = m[  1 ], a02 = m[  2 ], a03 = m[  3 ],
    a10 = m[  4 ], a11 = m[  5 ], a12 = m[  6 ], a13 = m[  7 ],
    a20 = m[  8 ], a21 = m[  9 ], a22 = m[ 10 ], a23 = m[ 11 ],
    a30 = m[ 12 ], a31 = m[ 13 ], a32 = m[ 14 ], a33 = m[ 15 ],
    b00 = a00 * a11 - a01 * a10,  b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,  b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,  b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,  b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,  b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,  b11 = a22 * a33 - a23 * a32;

  return MathCat.vecScale( 1.0 / b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06, [
    a11 * b11 - a12 * b10 + a13 * b09,
    a02 * b10 - a01 * b11 - a03 * b09,
    a31 * b05 - a32 * b04 + a33 * b03,
    a22 * b04 - a21 * b05 - a23 * b03,
    a12 * b08 - a10 * b11 - a13 * b07,
    a00 * b11 - a02 * b08 + a03 * b07,
    a32 * b02 - a30 * b05 - a33 * b01,
    a20 * b05 - a22 * b02 + a23 * b01,
    a10 * b10 - a11 * b08 + a13 * b06,
    a01 * b08 - a00 * b10 - a03 * b06,
    a30 * b04 - a31 * b02 + a33 * b00,
    a21 * b02 - a20 * b04 - a23 * b00,
    a11 * b07 - a10 * b09 - a12 * b06,
    a00 * b09 - a01 * b07 + a02 * b06,
    a31 * b01 - a30 * b03 - a32 * b00,
    a20 * b03 - a21 * b01 + a22 * b00
  ] );
};

/**
 * Apply a mat4 to a vec4.
 * @param {number[]} m mat4
 * @param {number[]} v vec4
 * @returns {number[]} vec4, Applied vector
 * @static
 */
MathCat.mat4ApplyToVec4 = ( m, v ) => {
  return [
    m[ 0 ] * v[ 0 ] + m[ 4 ] * v[ 1 ] + m[ 8 ] * v[ 2 ] + m[ 12 ] * v[ 3 ],
    m[ 1 ] * v[ 0 ] + m[ 5 ] * v[ 1 ] + m[ 9 ] * v[ 2 ] + m[ 13 ] * v[ 3 ],
    m[ 2 ] * v[ 0 ] + m[ 6 ] * v[ 1 ] + m[ 10 ] * v[ 2 ] + m[ 14 ] * v[ 3 ],
    m[ 3 ] * v[ 0 ] + m[ 7 ] * v[ 1 ] + m[ 11 ] * v[ 2 ] + m[ 15 ] * v[ 3 ]
  ];
};

/**
 * Transpose a mat4.
 * @param {number[]} m mat4
 * @returns {number[]} mat4, Transposed matrix
 * @static
 */
MathCat.mat4Transpose = ( m ) => [
  m[ 0 ], m[ 4 ], m[ 8 ], m[ 12 ],
  m[ 1 ], m[ 5 ], m[ 9 ], m[ 13 ],
  m[ 2 ], m[ 6 ], m[ 10 ], m[ 14 ],
  m[ 3 ], m[ 7 ], m[ 11 ], m[ 15 ]
];

/**
 * Generate an indentity mat4.
 * @returns {number[]} mat4, Identity matrix
 * @static
 */
MathCat.mat4Identity = () => [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];

/**
 * Generate a 3d translate matrix.
 * @param {number[]} v vec3, Translation
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4Translate = ( v ) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  v[ 0 ], v[ 1 ], v[ 2 ], 1
];

/**
 * Generate a 3d scale matrix.  
 * See also: {@link MathCat#mat4ScaleXYZ}
 * @param {number[]} v vec3, Scaling
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4Scale = ( v ) => [
  v[ 0 ], 0, 0, 0,
  0, v[ 1 ], 0, 0,
  0, 0, v[ 2 ], 0,
  0, 0, 0, 1
];

/**
 * Generate a 3d scale matrix.  
 * See also: {@link MathCat#mat4Scale}
 * @param {number} s scalar, Scaling
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4ScaleXYZ = ( s ) => [
  s, 0, 0, 0,
  0, s, 0, 0,
  0, 0, s, 0,
  0, 0, 0, 1
];

/**
 * Generate a 3d rotation matrix.  
 * 2d rotation around x axis.
 * @param {number} t scalar, Rotation angle in radians
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4RotateX = ( t ) => [
  1, 0, 0, 0,
  0, Math.cos( t ), -Math.sin( t ), 0,
  0, Math.sin( t ), Math.cos( t ), 0,
  0, 0, 0, 1
];

/**
 * Generate a 3d rotation matrix.  
 * 2d rotation around y axis.
 * @param {number} t scalar, Rotation angle in radians
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4RotateY = ( t ) => [
  Math.cos( t ), 0, Math.sin( t ), 0,
  0, 1, 0, 0,
  -Math.sin( t ), 0, Math.cos( t ), 0,
  0, 0, 0, 1
];

/**
 * Generate a 3d rotation matrix.  
 * 2d rotation around z axis.
 * @param {number} t scalar, Rotation angle in radians
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4RotateZ = ( t ) => [
  Math.cos( t ), -Math.sin( t ), 0, 0,
  Math.sin( t ), Math.cos( t ), 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

/**
 * Generate a "LookAt" view matrix.
 * @param {number[]} pos vec3, Position
 * @param {number[]} tar vec3, Target
 * @param {number[]} [air=[ 0.0, 1.0, 0.0 ]] vec3, Up vector
 * @param {number} [rot=0.0] scalar, Roll. yeahhhh I think such lookAt generator should have roll parameter
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4LookAt = ( pos, tar, air, rot ) => {
  const dir = MathCat.vecNormalize( MathCat.vecSub( tar, pos ) );
  let sid = MathCat.vecNormalize( MathCat.vec3Cross( dir, air || [ 0.0, 1.0, 0.0 ] ) );
  let top = MathCat.vec3Cross( sid, dir );
  sid = MathCat.vecAdd(
    MathCat.vecScale( Math.cos( rot || 0.0 ), sid ),
    MathCat.vecScale( Math.sin( rot || 0.0 ), top )
  );
  top = MathCat.vec3Cross( sid, dir );

  return [
    sid[ 0 ], top[ 0 ], dir[ 0 ], 0.0,
    sid[ 1 ], top[ 1 ], dir[ 1 ], 0.0,
    sid[ 2 ], top[ 2 ], dir[ 2 ], 0.0,
    -sid[ 0 ] * pos[ 0 ] - sid[ 1 ] * pos[ 1 ] - sid[ 2 ] * pos[ 2 ],
    -top[ 0 ] * pos[ 0 ] - top[ 1 ] * pos[ 1 ] - top[ 2 ] * pos[ 2 ],
    -dir[ 0 ] * pos[ 0 ] - dir[ 1 ] * pos[ 1 ] - dir[ 2 ] * pos[ 2 ],
    1.0
  ];
};

/**
 * Generate a "Perspective" projection matrix.  
 * It won't include aspect!
 * @param {number} fov scalar
 * @param {number} near scalar
 * @param {number} far scalar
 * @returns {number[]} mat4, Generated matrix
 * @static
 */
MathCat.mat4Perspective = ( fov, near, far ) => {
  const p = 1.0 / Math.tan( fov * Math.PI / 360.0 );
  const d = ( far - near );
  return [
    p, 0.0, 0.0, 0.0,
    0.0, p, 0.0, 0.0,
    0.0, 0.0, ( far + near ) / d, 1.0,
    0.0, 0.0, -2 * far * near / d, 0.0
  ];
};

export default MathCat;