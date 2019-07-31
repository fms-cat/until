let requiredFields = ( object, nanithefuck, fields ) => {
  fields.map( ( field ) => {
    if ( typeof object[ field ] === 'undefined' ) {
      throw 'GLCat-Path: ' + field + ' is required for ' + nanithefuck;
    }
  } );
};

let Path = class {
  constructor( glCat, params ) {
    let it = this;

    it.glCat = glCat;
    it.gl = glCat.gl;

    it.paths = {};
    it.commonShader = '';
    it.globalFunc = () => {};
    it.params = params || {};
  }

  add( paths ) {
    let it = this;

    for ( let name in paths ) {
      let path = paths[ name ];
      requiredFields( path, 'path object', [
        'vert',
        'frag'
      ] );
      it.paths[ name ] = path;

      if ( typeof path.depthTest === 'undefined' ) { path.depthTest = true; }
      if ( typeof path.depthWrite === 'undefined' ) { path.depthWrite = true; }
      if ( typeof path.blend === 'undefined' ) { path.blend = [ it.gl.SRC_ALPHA, it.gl.ONE_MINUS_SRC_ALPHA ]; }
      if ( typeof path.cull === 'undefined' ) { path.cull = true; }

      if ( path.width && path.height ) {
        it.setupFramebuffer( name, path.width, path.height );
      }

      path.program = it.glCat.createProgram(
        it.commonShader + path.vert,
        it.commonShader + path.frag
      );
    }
  }

  render( name, params ) {
    let it = this;

    let path = it.paths[ name ];
    if ( !path ) { throw 'GLCat-Path: The path called ' + name + ' is not defined!'; }

    if ( !params ) { params = {}; }

    if ( params.enable !== undefined && !params.enable && path.isInitialized ) {
      return;
    }
    path.isInitialized = true;

    if ( params.width && params.height ) {
      it.setupFramebuffer( name, params.width, params.height );
    }
    params.framebuffer = typeof params.target !== 'undefined' ? params.target.framebuffer : path.framebuffer ? path.framebuffer.framebuffer : null;

    let width = params.viewport ? params.viewport[ 2 ] : params.width || path.width;
    let height = params.viewport ? params.viewport[ 3 ] : params.height || path.height;

    if ( !width || !height ) {
      throw 'GLCat-Path: width or height is invalid';
    }

    if ( params.viewport ) {
      it.gl.viewport( ...params.viewport );
    } else {
      it.gl.viewport( 0, 0, width, height );
    }

    it.glCat.useProgram( path.program );
    path.cull ? it.gl.enable( it.gl.CULL_FACE ) : it.gl.disable( it.gl.CULL_FACE );
    it.gl.bindFramebuffer( it.gl.FRAMEBUFFER, params.framebuffer );
    if ( it.params.drawbuffers ) {
      it.glCat.drawBuffers( path.drawbuffers ? path.drawbuffers : params.framebuffer === null ? [ it.gl.BACK ] : [ it.gl.COLOR_ATTACHMENT0 ] );
    }
    it.gl.blendFunc( ...path.blend );
    if ( path.clear ) { it.glCat.clear( ...path.clear ); }
    path.depthTest ? it.gl.enable( it.gl.DEPTH_TEST ) : it.gl.disable( it.gl.DEPTH_TEST );
    path.depthWrite ? it.gl.depthMask( true ) : it.gl.depthMask( false );

    it.glCat.uniform2fv( 'resolution', [ width, height ] );
    it.globalFunc( path, params );

    if ( path.func ) { path.func( path, params ); }

    if ( path.swapbuffer ) {
      const temp = path.framebuffer;
      path.framebuffer = path.swapbuffer;
      path.swapbuffer = temp;
    }
  }

  setupFramebuffer( name, width, height ) {
    let it = this;

    let path = it.paths[ name ];
    if ( !path ) { throw 'GLCat-Path: The path called ' + name + ' is not defined!'; }

    if ( path.framebuffer ) {
      if ( path.framebuffer === true ) { // the fucking true
        if ( path.drawbuffers ) {
          path.framebuffer = it.glCat.createDrawBuffers( width, height, path.drawbuffers );
        } else if ( path.float ) {
          path.framebuffer = it.glCat.createFloatFramebuffer( width, height );
        } else {
          path.framebuffer = it.glCat.createFramebuffer( width, height );
        }

        if ( path.swapbuffer ) {
          if ( path.drawbuffers ) {
            path.swapbuffer = it.glCat.createDrawBuffers( width, height, path.drawbuffers );
          } else if ( path.float ) {
            path.swapbuffer = it.glCat.createFloatFramebuffer( width, height );
          } else {
            path.swapbuffer = it.glCat.createFramebuffer( width, height );
          }
        }
      } else if ( path.width === width && path.height === height ) {
        return;
      } else {
        if ( path.drawbuffers ) {
          it.glCat.resizeDrawBuffers( path.framebuffer, width, height );
        } else if ( path.float ) {
          it.glCat.resizeFloatFramebuffer( path.framebuffer, width, height );
        } else {
          it.glCat.resizeFramebuffer( path.framebuffer, width, height );
        }

        if ( path.swapbuffer ) {
          if ( path.drawbuffers ) {
            it.glCat.resizeDrawBuffers( path.swapbuffer, width, height );
          } else if ( path.float ) {
            it.glCat.resizeFloatFramebuffer( path.swapbuffer, width, height );
          } else {
            it.glCat.resizeFramebuffer( path.swapbuffer, width, height );
          }
        }
      }

      if ( path.filter ) {
        it.glCat.textureFilter( path.framebuffer.texture, path.filter );
      }
      if ( path.wrap ) {
        it.glCat.textureWrap( path.framebuffer.texture, path.wrap );
      }

      path.width = width;
      path.height = height;
    }
  }

  renderOutsideOfPipeline( name, params ) {
    this.render( name, params );
  }

  begin() {}
  end() {}

  replaceProgram( name, vert, frag ) {
    const path = this.paths[ name ];
    if ( !path ) { throw 'GLCat-Path: The path called ' + name + ' is not defined!'; }

    try {
      const prevProgram = path.program;
      const newProgram = this.glCat.createProgram(
        this.commonShader + vert,
        this.commonShader + frag
      );
      if ( newProgram ) {
        path.program = newProgram;
        this.gl.deleteProgram( prevProgram.program );
        this.gl.deleteShader( prevProgram.vert );
        this.gl.deleteShader( prevProgram.frag );
      }
    } catch ( e ) {
      console.error( e );
    }
  }

  resize( name, width, height ) {
    let it = this;

    let path = it.paths[ name ];

    path.width = width;
    path.height = height;

    if ( path.framebuffer ) {
      if ( it.params.drawbuffers && path.drawbuffers ) {
        path.framebuffer = it.glCat.createDrawBuffers( path.width, path.height, path.drawbuffers );
      } else if ( path.float ) {
        it.glCat.resizeFloatFramebuffer( path.framebuffer, path.width, path.height );
      } else {
        it.glCat.resizeFramebuffer( path.framebuffer, path.width, path.height );
      }
    }

    if ( typeof path.onresize === 'function' ) {
      path.onresize( path, width, height );
    }
  }

  setGlobalFunc( func ) { this.globalFunc = func; }

  fb( name ) {
    if ( !this.paths[ name ] ) { throw 'glcat-path.fb: path called ' + name + ' is not defined'; }
    if ( !this.paths[ name ].framebuffer ) { throw 'glcat-path.fb: there is no framebuffer for the path ' + name; }

    return this.paths[ name ].framebuffer;
  }
};

Path.nullFb = { framebuffer: null };

export default Path;