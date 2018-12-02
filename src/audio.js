import * as UltraCat from './libs/ultracat';

export const Audio = class {
  constructor( context ) {
    // == certain variables ====================================================
    this.audio = new AudioContext();
    this.sampleRate = this.audio.sampleRate;

    this.bufferSize = 2048;
    this.processor = this.audio.createScriptProcessor( this.bufferSize, 2, 2 );
    this.processor.onaudioprocess = ( event ) => this.onprocess( event );
    this.bufferPoolSize = 512;
    this.bufferPoolIndex = 0;
    this.bufferPool = new Float32Array( 4 * this.bufferSize * this.bufferPoolSize );
    this.analyserData = new Float32Array( 2048 );
    this.analyser = this.audio.createAnalyser();
    this.analyser.fftSize = 2048;
    this.processor.connect( this.audio.destination );
    this.processor.connect( this.analyser );

    this.isPlaying = true;
    this.currentTime = 0;
    this.currentTimeDate = Date.now();

    // == setup gl stuff =======================================================
    const glCatPath = this.glCatPath = context.glCatPath;
    const glCat = this.glCat = glCatPath.glCat;
    const gl = this.gl = glCat.gl;

    const vboQuad = glCat.createVertexbuffer(
      new Float32Array( UltraCat.triangleStripQuad )
    );

    const textureChord = glCat.createTexture();
    glCat.setTextureFromFloatArray(
      textureChord,
      8,
      4,
      [
        0, 5, 10, 12, 7, 19, 17, 22,
        0, 7, 4, 14, 11, 19, 16, 26,
        0, 2, 5, 12, 7, 14, 10, 22,
        0, 7, 4, 19, 11, 26, 16, 31,
      ],
      gl.LUMINANCE
    );
    glCat.textureWrap( textureChord, gl.REPEAT );

    // == path definition begin ================================================
    glCatPath.add( {
      audio: {
        width: this.bufferSize,
        height: this.bufferPoolSize,
        vert: require( './shaders/quad.vert' ),
        frag: require( './shaders/audio.frag' ),
        blend: [ gl.ONE, gl.ZERO ],
        clear: [ 0.0, 0.0, 0.0, 0.0 ],
        framebuffer: true,
        float: true,
        func: ( path, params ) => {
          glCat.attribute( 'p', vboQuad, 2 );
          glCat.uniform1f( 'timeHead', params.time % ( 16.0 / 160.0 * 60.0 ) );
          glCat.uniform1f( 'patternHead', Math.floor( params.time / ( 16.0 / 160.0 * 60.0 ) ) );
          glCat.uniform1f( 'bufferSize', this.bufferSize );
          glCat.uniform1f( 'sampleRate', this.sampleRate );
          glCat.uniformTexture( 'samplerChord', textureChord, 0 );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      }
    } );

    if ( module.hot ) {
      module.hot.accept(
        [
          './shaders/quad.vert',
          './shaders/audio.frag'
        ],
        () => {
          glCatPath.replaceProgram(
            'audio',
            require( './shaders/quad.vert' ),
            require( './shaders/audio.frag' )
          );
        }
      );
    }
  }

  play() {
    this.isPlaying = true;
    this.currentTimeDate = Date.now();
  }

  pause() {
    this.isPlaying = false;
  }

  setTime( time ) {
    this.currentTime = time;
    this.currentTimeDate = Date.now();
    this.bufferPoolIndex = 0;
  }

  getTime() {
    let time = this.currentTime - this.bufferSize / this.sampleRate;
    if ( this.isPlaying ) {
      time += ( Date.now() - this.currentTimeDate ) / 1000.0;
    }
    return time;
  }

  getAnalyserData() {
    this.analyser.getFloatFrequencyData( this.analyserData );
    return this.analyserData;
  }

  onprocess( event ) {
    const outL = event.outputBuffer.getChannelData( 0 );
    const outR = event.outputBuffer.getChannelData( 1 );

    if ( this.isPlaying ) {
      const glCatPath = this.glCatPath;
      const gl = this.gl;

      if ( this.bufferPoolIndex === 0 ) {
        glCatPath.renderOutsideOfPipeline( 'audio', {
          time: this.currentTime,
        } );

        gl.readPixels(
          0, // x
          0, // y
          this.bufferSize, // width
          this.bufferPoolSize, // height
          gl.RGBA, // format
          gl.FLOAT, // type
          this.bufferPool // dst
        );
      }

      for ( let i = 0; i < this.bufferSize; i ++ ) {
        outL[ i ] = this.bufferPool[ this.bufferPoolIndex + i * 4 ];
        outR[ i ] = this.bufferPool[ this.bufferPoolIndex + i * 4 + 1 ];
      }
      this.bufferPoolIndex = ( this.bufferPoolIndex + 4 * this.bufferSize ) % ( 4 * this.bufferSize * this.bufferPoolSize );

      this.currentTime += this.bufferSize / this.sampleRate;
      this.currentTimeDate = Date.now();
    } else {
      for ( let i = 0; i < this.bufferSize; i ++ ) {
        outL[ i ] = 0.0;
        outR[ i ] = 0.0;
      }

    }
  }
};