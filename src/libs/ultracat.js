// お前、ナンデモアリかよ！

export const triangleStripQuad = [ -1, -1, 1, -1, -1, 1, 1, 1 ];
export const triangleStripQuad3 = [ -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0 ];
export const triangleStripQuadNor = [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ];
export const triangleStripQuadUV = [ 0, 0, 1, 0, 0, 1, 1, 1 ];

// destructive
export const shuffleArrayD = ( array, dice ) => {
  const f = dice ? dice : () => Math.random();
  for ( let i = 0; i < array.length - 1; i ++ ) {
    const ir = i + Math.floor( f() * ( array.length - i ) );
    const temp = array[ ir ];
    array[ ir ] = array[ i ];
    array[ i ] = temp;
  }
  return array;
};

export const triIndexToLineIndex = ( array ) => {
  let ret = [];
  for ( let i = 0; i < array.length / 3; i ++ ) {
    const head = i * 3;
    ret.push(
      array[ head     ], array[ head + 1 ],
      array[ head + 1 ], array[ head + 2 ],
      array[ head + 2 ], array[ head     ]
    );
  }
  return ret;
};

export const matrix1d = ( w ) => {
  let arr = [];
  for ( let ix = 0; ix < w; ix ++ ) {
    arr.push( ix );
  }
  return arr;
};

export const matrix2d = ( w, h ) => {
  let arr = [];
  for ( let iy = 0; iy < h; iy ++ ) {
    for ( let ix = 0; ix < w; ix ++ ) {
      arr.push( ix, iy );
    }
  }
  return arr;
};

export const matrix3d = ( w, h, d ) => {
  let arr = [];
  for ( let iz = 0; iz < d; iz ++ ) {
    for ( let iy = 0; iy < h; iy ++ ) {
      for ( let ix = 0; ix < w; ix ++ ) {
        arr.push( ix, iy, iz );
      }
    }
  }
  return arr;
};

export const lerp = ( a, b, x ) => a + ( b - a ) * x;
export const clamp = ( x, l, h ) => Math.min( Math.max( x, l ), h );
export const saturate = ( x ) => Math.min( Math.max( x, 0.0 ), 1.0 );
export const linearstep = ( a, b, x ) => saturate( ( x - a ) / ( b - a ) );
export const smoothstep = ( a, b, x ) => {
  const t = linearstep( a, b, x );
  return t * t * ( 3.0 - 2.0 * t );
};

export const ExpSmooth = class {
  constructor( factor ) {
    this.factor = factor;
    this.value = 0.0;
  }

  update( value, dt ) {
    this.value = lerp( value, this.value, Math.exp( -this.factor * dt ) );
    return this.value;
  }
};