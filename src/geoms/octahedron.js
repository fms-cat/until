let genOctahedron = ( _props ) => {
  let props = Object.assign( {
    div: 1.0
  }, _props );

  let div = parseInt( Math.max( 0, props.div ) );

  let pos = [];
  let nor = [];
  let ind = [];

  for ( let ii = 0; ii < 2; ii ++ ) {
    for ( let iq = 0; iq < 4; iq ++ ) {
      for ( let iy = 0; iy < div + 1; iy ++ ) {
        for ( let ix = 0; ix < iy + 1; ix ++ ) {
          let lat0 = ( ii * 2.0 + iy / ( div + 1 ) ) * Math.PI / 2.0;
          let lat1 = ( ii * 2.0 + ( iy + 1 ) / ( div + 1 ) ) * Math.PI / 2.0;

          let lon0 = ( ii * 2.0 - 1.0 ) * ( ( ix - 1 ) / Math.max( 1, iy ) + iq ) * Math.PI / 2.0;
          let lon1 = ( ii * 2.0 - 1.0 ) * ( ix / ( iy + 1 ) + iq ) * Math.PI / 2.0;
          let lon2 = ( ii * 2.0 - 1.0 ) * ( ix / Math.max( 1, iy ) + iq ) * Math.PI / 2.0;
          let lon3 = ( ii * 2.0 - 1.0 ) * ( ( ix + 1 ) / ( iy + 1 ) + iq ) * Math.PI / 2.0;

          if ( ix !== 0 ) {
            ind.push(
              pos.length / 3,
              pos.length / 3 + 1,
              pos.length / 3 + 2
            );

            let x1 = Math.sin( lat0 ) * Math.cos( lon0 );
            let y1 = Math.cos( lat0 );
            let z1 = Math.sin( lat0 ) * Math.sin( lon0 );

            let x2 = Math.sin( lat1 ) * Math.cos( lon1 );
            let y2 = Math.cos( lat1 );
            let z2 = Math.sin( lat1 ) * Math.sin( lon1 );

            let x3 = Math.sin( lat0 ) * Math.cos( lon2 );
            let y3 = Math.cos( lat0 );
            let z3 = Math.sin( lat0 ) * Math.sin( lon2 );

            pos.push(
              x1, y1, z1,
              x2, y2, z2,
              x3, y3, z3
            );

            {
              let x = x1 + x2 + x3;
              let y = y1 + y2 + y3;
              let z = z1 + z2 + z3;
              let l = Math.sqrt( x * x + y * y + z * z );

              for ( let i = 0; i < 3; i ++ ) {
                nor.push(
                  x / l,
                  y / l,
                  z / l
                );
              }
            }
          }

          {
            ind.push(
              pos.length / 3,
              pos.length / 3 + 1,
              pos.length / 3 + 2
            );

            let x1 = Math.sin( lat0 ) * Math.cos( lon2 );
            let y1 = Math.cos( lat0 );
            let z1 = Math.sin( lat0 ) * Math.sin( lon2 );

            let x2 = Math.sin( lat1 ) * Math.cos( lon1 );
            let y2 = Math.cos( lat1 );
            let z2 = Math.sin( lat1 ) * Math.sin( lon1 );

            let x3 = Math.sin( lat1 ) * Math.cos( lon3 );
            let y3 = Math.cos( lat1 );
            let z3 = Math.sin( lat1 ) * Math.sin( lon3 );

            pos.push(
              x1, y1, z1,
              x2, y2, z2,
              x3, y3, z3
            );

            {
              let x = x1 + x2 + x3;
              let y = y1 + y2 + y3;
              let z = z1 + z2 + z3;
              let l = Math.sqrt( x * x + y * y + z * z );

              for ( let i = 0; i < 3; i ++ ) {
                nor.push(
                  x / l,
                  y / l,
                  z / l
                );
              }
            }
          }
        }
      }
    }
  }

  return {
    position: pos,
    normal: nor,
    index: ind
  };
};

module.exports = genOctahedron;