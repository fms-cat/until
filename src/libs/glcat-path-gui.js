import Path from './glcat-path';

let requiredFields = ( object, nanithefuck, fields ) => {
  fields.map( ( field ) => {
    if ( typeof object[ field ] === 'undefined' ) {
      throw 'GLCat-Path: ' + field + ' is required for ' + nanithefuck;
    }
  } );
};

let PathGUI = class extends Path {
  constructor( glCat, params ) {
    super( glCat, params );
    let it = this;

    requiredFields( params, 'params', [
      'canvas',
      'el'
    ] );

    it.gui = { parent: it.params.el };

    it.gui.info = document.createElement( 'span' );
    it.gui.parent.appendChild( it.gui.info );

    it.gui.range = document.createElement( 'input' );
    it.gui.range.type = 'range';
    it.gui.range.min = 0;
    it.gui.range.max = 0;
    it.gui.range.step = 1;
    it.gui.parent.appendChild( it.gui.range );

    it.dateList = new Array( 30 ).fill( 0 );
    it.dateListIndex = 0;
    it.totalFrames = 0;
    it.fps = 0;
    it.currentIndex = 0;
    it.viewName = '';
    it.viewIndex = 0;

    let gl = glCat.gl;
    let vboQuad = glCat.createVertexbuffer( new Float32Array( [ -1, -1, 1, -1, -1, 1, 1, 1 ] ) );
    it.add( {
      __PathGuiReturn: {
        vert: 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}',
        frag: 'precision highp float;uniform vec2 r;uniform sampler2D s;void main(){gl_FragColor=texture2D(s,gl_FragCoord.xy/r);}',
        blend: [ gl.ONE, gl.ONE ],
        clear: [ 0.0, 0.0, 0.0, 1.0 ],
        func: ( _p, params ) => {
          gl.viewport( 0, 0, it.params.canvas.width, it.params.canvas.height );
          glCat.uniform2fv( 'r', [ it.params.canvas.width, it.params.canvas.height ] );

          glCat.attribute( 'p', vboQuad, 2 );
          glCat.uniformTexture( 's', params.input, 0 );
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
        }
      },
    } );
  }

  begin() {
    let it = this;

    it.currentIndex = 0;
  }

  end() {
    let it = this;

    it.gui.range.max = Math.max( it.gui.range.max, it.currentIndex );
    it.currentIndex = 0;

    let now = +new Date() * 1E-3;
    it.dateList[ it.dateListIndex ] = now;
    it.dateListIndex = ( it.dateListIndex + 1 ) % it.dateList.length;
    it.fps = (
      ( it.dateList.length - 1 )
      / ( now - it.dateList[ it.dateListIndex ] )
    ).toFixed( 1 );

    it.totalFrames ++;

    it.gui.info.innerText = (
      'Path: ' + it.viewName + ' (' + it.viewIndex + ')\n'
      + it.fps + ' FPS\n'
      + it.totalFrames + ' frames\n'
    );
  }

  render( name, params ) {
    let it = this;

    it.currentIndex ++;
    let view = parseInt( it.gui.range.value );

    if ( it.currentIndex <= view || view === 0 ) {
      it.viewName = view === 0 ? '*Full*' : name;
      it.viewIndex = it.currentIndex;

      super.render( name, params );

      if ( it.currentIndex === view ) {
        let t = (
          ( params && params.target )
            ? params.target
            : it.paths[ name ].framebuffer
        );

        if ( t && t.framebuffer ) {
          let i = t.textures ? t.textures[ 0 ] : t.texture;
          if ( it.params.stretch ) {
            super.render( '__PathGuiReturn', {
              target: PathGUI.nullFb,
              input: i,
              width: it.params.canvas.width,
              height: it.params.canvas.height
            } );
          } else {
            it.params.canvas.width = ( params ? params.width : 0 ) || it.paths[ name ].width || it.params.width;
            it.params.canvas.height = ( params ? params.height : 0 ) || it.paths[ name ].height || it.params.height;
            super.render( '__PathGuiReturn', {
              target: PathGUI.nullFb,
              input: i
            } );
          }
        }
      }
    }
  }

  renderOutsideOfPipeline( name, params ) {
    super.render( name, params );
  }
};

export default PathGUI;