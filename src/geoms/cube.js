let genCube = ( _props ) => {
  let props = Object.assign( {
    size: 1.0
  }, _props );

  let pos = [];
  let nor = [];
  let ind = [];

  const S = props.size;

  for ( let i = 0; i < 6; i ++ ) {
    let p = [
      [ -S, -S,  S ],
      [  S, -S,  S ],
      [ -S,  S,  S ],
      [  S,  S,  S ]
    ];
    let n = [
      [ 0, 0, 1 ],
      [ 0, 0, 1 ],
      [ 0, 0, 1 ],
      [ 0, 0, 1 ]
    ];
    let id = [
      0, 1, 3,
      0, 3, 2
    ].map( ( v ) => v + i * 4 );

    if ( i !== 0 ) {
      let func = ( v ) => {
        if ( i < 4 ) {
          let t = i * Math.PI / 2.0;
          let x = v[ 0 ];
          let z = v[ 2 ];
          v[ 0 ] = Math.cos( t ) * x - Math.sin( t ) * z;
          v[ 2 ] = Math.sin( t ) * x + Math.cos( t ) * z;
        } else {
          let t = ( i - 0.5 ) * Math.PI;
          let y = v[ 1 ];
          let z = v[ 2 ];
          v[ 1 ] = Math.cos( t ) * y - Math.sin( t ) * z;
          v[ 2 ] = Math.sin( t ) * y + Math.cos( t ) * z;
        }
      };

      p.map( func );
      n.map( func );
    }

    p.map( ( v ) => pos.push( ...v ) );
    n.map( ( v ) => nor.push( ...v ) );
    ind.push( ...id );
  }

  return {
    position: pos,
    normal: nor,
    index: ind
  };
};

module.exports = genCube;