module.exports = ( _props ) => {
  let props = Object.assign( {
    radius: 1.0,
    hole: 0.5,
    segments: 16
  }, _props );

  let pos = new Float32Array( 6 * props.segments );
  let uv = new Float32Array( 4 * props.segments );
  let nor = new Float32Array( 6 * props.segments );
  let ind = new Int16Array( 6 * props.segments );

  let R = props.radius;
  let r = props.hole;
  let rpR = props.hole / props.radius;

  const dt = Math.PI * 2.0 / props.segments;
  for ( let i = 0; i < props.segments; i ++ ) {
    const t = i * dt;
    const cosT = Math.cos( t );
    const sinT = Math.sin( t );
    pos.set( [
      cosT * r, sinT * r, 0.0,
      cosT * R, sinT * R, 0.0
    ], i * 6 );
    uv.set( [
      0.5 + cosT * 0.5 * rpR, 0.5 + sinT * 0.5 * rpR,
      0.5 + cosT * 0.5, 0.5 + sinT * 0.5
    ], i * 4 );

    nor.set( [
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0
    ], i * 6 );

    const i00 = i * 2;
    const i01 = i00 + 1;
    const i10 = ( i === props.segments - 1 ) ? 0 : ( i * 2 + 2 );
    const i11 = i10 + 1;
    ind.set( [
      i00, i01, i11,
      i00, i11, i10
    ], i * 6 );
  }

  return {
    position: pos,
    uv: uv,
    normal: nor,
    index: ind
  };
};