/**
 * @typedef {Object} GLCatProgram
 * @property {WebGLProgram} program
 * @property {Object<string,GLint|WebGLUniformLocation>} locations
 */

/**
 * @typedef {Object} GLCatFramebuffer
 * @property {WebGLFramebuffer} framebuffer
 * @property {WebGLRenderbuffer} depth
 * @property {WebGLTexture} texture
 */

/**
 * @typedef {Object} GLCatDrawBuffers
 * @property {WebGLFramebuffer} framebuffer
 * @property {WebGLRenderbuffer} depth
 * @property {WebGLTexture[]} textures
 */

/**
 * @typedef {ImageBitmap|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} Pixelable
 */

/**
 * WebGL wrapper with lots of respect to the original API, starring FMS_Cat.
 */
const GLCat = class {
  /**
   * Create a new GLCat instance.
   * @param {WebGLRenderingContext} _gl Original WebGL context
   */
  constructor( _gl ) {
    this.gl = _gl;
    const gl = this.gl;

    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
    gl.enable( gl.BLEND );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

    /**
     * Contain extensions.  
     * Keys are extension name, and values are extension object.
     * @type {Object<string,WebGLExtension>}
     * @protected
     */
    this.__extensions = {};

    /**
     * Currently using program.
     * @type {WebGLProgram}
     * @protected
     */
    this.__currentProgram = null;
  }

  /**
   * Get a new or existing extension object.
   * @param {string} _name Name of the extension
   * @param {boolean} [_throw=false] If this is true, exception will be throwed when it is failed to get extension
   * @returns {WebGLExtension} Extension object
   */
  getExtension( _name, _throw ) {
    const gl = this.gl;

    if ( typeof _name === 'object' && _name.isArray() ) {
      return _name.every( ( name ) => this.getExtension( name, _throw ) );
    } else if ( typeof _name === 'string' ) {
      if ( this.__extensions[ _name ] ) {
        return this.__extensions[ _name ];
      } else {
        this.__extensions[ _name ] = gl.getExtension( _name );
        if ( this.__extensions[ _name ] ) {
          return this.__extensions[ _name ];
        } else {
          if ( _throw ) {
            throw new Error( 'The extension "' + _name + '" is not supported' );
          }
          return null;
        }
      }
    } else {
      throw new Error( 'GLCat.getExtension: _name must be string or array' );
    }
  }

  /**
   * Create a new GLCat program object.
   * @param {string} _vert GLSL source of the vertex shader
   * @param {string} _frag GLSL source of the fragment shader
   * @param {Function} [_onError] Will be called if compile/link error is occurred
   * @returns {GLCatProgram} Created program
   */
  createProgram( _vert, _frag, _onError ) {
    const gl = this.gl;

    let error;
    if ( typeof _onError === 'function' ) {
      error = _onError;
    } else {
      error = ( _str ) => { throw new Error( _str ); };
    }

    const vert = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vert, _vert );
    gl.compileShader( vert );
    if ( !gl.getShaderParameter( vert, gl.COMPILE_STATUS ) ) {
      error( gl.getShaderInfoLog( vert ) );
      gl.deleteShader( vert );
      return null;
    }

    const frag = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( frag, _frag );
    gl.compileShader( frag );
    if ( !gl.getShaderParameter( frag, gl.COMPILE_STATUS ) ) {
      error( gl.getShaderInfoLog( frag ) );
      gl.deleteShader( vert );
      gl.deleteShader( frag );
      return null;
    }

    const program = gl.createProgram();
    gl.attachShader( program, vert );
    gl.attachShader( program, frag );
    gl.linkProgram( program );
    if ( gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
      return {
        vert: vert,
        frag: frag,
        program: program,
        locations: {}
      };
    } else {
      error( gl.getProgramInfoLog( program ) );
      gl.deleteShader( vert );
      gl.deleteShader( frag );
      gl.deleteProgram( program );
      return null;
    }
  }

  /**
   * Specity a program to use.
   * @param {GLCatProgram} _program Program you want to use
   * @returns {void} void
   */
  useProgram( _program ) {
    const gl = this.gl;

    gl.useProgram( _program.program );
    this.__currentProgram = _program;
  }

  /**
   * Create a new vertex buffer.
   * @param {ArrayBuffer|ArrayBufferView} _source Source of the data
   * @returns {WebGLBuffer} Generated vertex buffer
   */
  createVertexbuffer( _source ) {
    const gl = this.gl;

    const buffer = gl.createBuffer();

    if ( _source ) { this.setVertexbuffer( buffer, _source ); }

    return buffer;
  }

  /**
   * Set new data into a vertex buffer.
   * @param {WebGLBuffer} _target Target vertex buffer
   * @param {ArrayBuffer|ArrayBufferView} _source Source of the data
   * @param {GLenum} [_usage=gl.STATIC_DRAW] Usage of the buffer
   * @returns {void} void
   */
  setVertexbuffer( _target, _source, _usage ) {
    const gl = this.gl;

    const usage = _usage || gl.STATIC_DRAW;

    gl.bindBuffer( gl.ARRAY_BUFFER, _target );
    gl.bufferData( gl.ARRAY_BUFFER, _source, usage );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
  }

  /**
   * Create a new index buffer.
   * @param {ArrayBuffer|ArrayBufferView} _source Source of the data
   * @returns {WebGLBuffer} Generated index buffer
   */
  createIndexbuffer( _source ) {
    const gl = this.gl;

    const buffer = gl.createBuffer();

    if ( _source ) { this.setIndexbuffer( buffer, _source ); }

    return buffer;
  }

  /**
   * Set new data into a index buffer.
   * @param {WebGLBuffer} _target Target index buffer
   * @param {ArrayBuffer|ArrayBufferView} _source Source of the data
   * @param {GLenum} [_usage=gl.STATIC_DRAW] Usage of the buffer
   * @returns {void} void
   */
  setIndexbuffer( _target, _source, _usage ) {
    const gl = this.gl;

    const usage = _usage || gl.STATIC_DRAW;

    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, _target );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, _source, usage );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
  }

  /**
   * Get location for given attribute variable name for current program.
   * @param {string} _name Name of the attribute variable
   * @returns {GLint} Location of the attribute variable
   */
  getAttribLocation( _name ) {
    const gl = this.gl;

    let location;
    if ( this.__currentProgram.locations[ _name ] ) {
      location = this.__currentProgram.locations[ _name ];
    } else {
      location = gl.getAttribLocation( this.__currentProgram.program, _name );
      this.__currentProgram.locations[ _name ] = location;
    }

    return location;
  }

  /**
   * Attach an vertex buffer as attribute variable to the current program.
   * @param {string} _name Name of the attribute variable
   * @param {WebGLBuffer} _buffer Vertex buffer
   * @param {GLint} _size Number of components per vertex. Must be 1, 2, 3 or 4
   * @param {GLenum} [_type=gl.FLOAT] Data type of each component
   * @param {GLsizei} [_stride=0] Stride in bytes
   * @param {GLintptr} [_offset=0] Offset in bytes
   * @returns {void} void
   */
  attribute( _name, _buffer, _size, _type, _stride, _offset ) {
    const gl = this.gl;

    const location = this.getAttribLocation( _name );
    if ( location === -1 ) { return; }

    gl.bindBuffer( gl.ARRAY_BUFFER, _buffer );
    gl.enableVertexAttribArray( location );
    gl.vertexAttribPointer( location, _size, _type || gl.FLOAT, false, _stride || 0, _offset || 0 );

    const ext = this.getExtension( 'ANGLE_instanced_arrays' );
    if ( ext ) {
      ext.vertexAttribDivisorANGLE( location, 0 );
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, null );
  }

  /**
   * Attach an vertex buffer as attribute variable to the current program.  
   * Can set divisor at 4th argument for use of instancing.
   * @param {string} _name Name of the attribute variable
   * @param {WebGLBuffer} _buffer Vertex buffer
   * @param {GLint} _size Number of components per vertex. Must be 1, 2, 3 or 4
   * @param {GLuint} _div Divisor of the attribute
   * @param {GLenum} [_type=gl.FLOAT] Data type of each component
   * @param {GLsizei} [_stride=0] Stride in bytes
   * @param {GLintptr} [_offset=0] Offset in bytes
   * @returns {void} void
   */
  attributeDivisor( _name, _buffer, _size, _div, _type, _stride, _offset ) {
    const gl = this.gl;

    this.getExtension( 'ANGLE_instanced_arrays', true );

    const location = this.getAttribLocation( _name );
    if ( location === -1 ) { return; }

    gl.bindBuffer( gl.ARRAY_BUFFER, _buffer );
    gl.enableVertexAttribArray( location );
    gl.vertexAttribPointer( location, _size, _type || gl.FLOAT, false, _stride || 0, _offset || 0 );

    const ext = this.getExtension( 'ANGLE_instanced_arrays' );
    if ( ext ) {
      ext.vertexAttribDivisorANGLE( location, _div );
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, null );
  }

  /**
   * Get location for given uniform variable name for current program.
   * @param {string} _name Name of the uniform variable
   * @returns {WebGLUniformLocation} Location of the uniform variable
   */
  getUniformLocation( _name ) {
    const gl = this.gl;

    let location;

    if ( typeof this.__currentProgram.locations[ _name ] !== 'undefined' ) {
      location = this.__currentProgram.locations[ _name ];
    } else {
      location = gl.getUniformLocation( this.__currentProgram.program, _name );
      this.__currentProgram.locations[ _name ] = location;
    }

    return location;
  }

  /**
   * Attach an uniform variable.  
   * Finally, laziness won.
   * @param {string} _type Type of the uniform variable
   * @param {string} _name Name of the uniform variable
   * @param {number} _value Value
   * @returns {void} void
   */
  uniform( _type, _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl[ 'uniform' + _type ]( location, _value );
  }

  /**
   * Attach an `int` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {number} _value `int` value
   * @returns {void} void
   */
  uniform1i( _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniform1i( location, _value );
  }

  /**
   * Attach a `float` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {number} _value `float` value
   * @returns {void} void
   */
  uniform1f( _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniform1f( location, _value );
  }

  /**
   * Attach an array of `vec2` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {Float32Array|number[]} _value Array of `vec2` value
   * @returns {void} void
   */
  uniform2fv( _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniform2fv( location, _value );
  }

  /**
   * Attach an array of `vec3` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {Float32Array|number[]} _value Array of `vec3` value
   * @returns {void} void
   */
  uniform3fv( _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniform3fv( location, _value );
  }

  /**
   * Attach an array of `vec4` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {Float32Array|number[]} _value Array of `vec4` value
   * @returns {void} void
   */
  uniform4fv( _name, _value ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniform4fv( location, _value );
  }

  /**
   * Attach an array of `mat4` type uniform variable.
   * @param {string} _name Name of the uniform variable
   * @param {Float32Array|number[]} _value Array of `mat4` value
   * @param {GLboolean} [_transpose=false] Specify whether to transpose the matrix
   * @returns {void} void
   */
  uniformMatrix4fv( _name, _value, _transpose ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.uniformMatrix4fv( location, _transpose || false, _value );
  }

  /**
   * Attach a `sampler2D` type uniform texture.
   * @param {string} _name Name of the uniform texture
   * @param {WebGLTexture} _texture Texture object
   * @param {number} _number Specify a texture unit, in integer
   * @returns {void} void
   */
  uniformTexture( _name, _texture, _number ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.activeTexture( gl.TEXTURE0 + _number );
    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.uniform1i( location, _number );
  }

  /**
   * Attach a `samplerCube` type uniform texture.
   * @param {string} _name Name of the uniform texture
   * @param {WebGLTexture} _texture Texture object
   * @param {number} _number Specify a texture unit, in integer
   * @returns {void} void
   */
  uniformCubemap( _name, _texture, _number ) {
    const gl = this.gl;

    const location = this.getUniformLocation( _name );
    gl.activeTexture( gl.TEXTURE0 + _number );
    gl.bindTexture( gl.TEXTURE_CUBE_MAP, _texture );
    gl.uniform1i( location, _number );
  }

  /**
   * Create a texture object.
   * @returns {WebGLTexture} Texture object
   */
  createTexture() {
    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.bindTexture( gl.TEXTURE_2D, null );

    return texture;
  }

  /**
   * Specify how to filter the texture.
   * @param {WebGLTexture} _texture Texture object
   * @param {GLenum} _filter Texture filter
   * @returns {void} void
   */
  textureFilter( _texture, _filter ) {
    const gl = this.gl;

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, _filter );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, _filter );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Specify how to wrap the texture.
   * @param {WebGLTexture} _texture Texture object
   * @param {GLenum} _filter Wrapping function for the texture
   * @returns {void} void
   */
  textureWrap( _texture, _wrap ) {
    const gl = this.gl;

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, _wrap );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, _wrap );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Set new data into a texture object.  
   * This function uses image data. If you want to source `Uint8Array`, use `GLCat.setTextureFromArray()` instead.
   * @param {WebGLTexture} _texture Texture object
   * @param {Pixelable} _source Source image of the pixel data
   * @returns {void} void
   */
  setTexture( _texture, _source ) {
    const gl = this.gl;

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _source );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Set new data into a texture object.  
   * This function uses `Uint8Array`. If you want to source image data, use `GLCat.setTexture()` instead.  
   * Or you want to use float texture? Try this: `GLCat.setTextureFromFloatArray()`
   * @param {WebGLTexture} _texture Texture object
   * @param {GLsizei} _width Width of the texture
   * @param {GLsizei} _height Height of the texture
   * @param {Uint8Array} _source Source buffer of the pixel data
   * @returns {void} void
   */
  setTextureFromArray( _texture, _width, _height, _source, _format ) {
    const gl = this.gl;

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, _format || gl.RGBA, _width, _height, 0, _format || gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array( _source ) );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Set new data into a texture object.  
   * This function uses `Float32Array`.  
   * If you can't grab `OES_texture_float` extension here, you will die at this point.
   * @param {WebGLTexture} _texture Texture object
   * @param {GLsizei} _width Width of the texture
   * @param {GLsizei} _height Height of the texture
   * @param {Float32Array} _source Source buffer of the pixel data
   * @returns {void} void
   */
  setTextureFromFloatArray( _texture, _width, _height, _source, _format ) {
    const gl = this.gl;

    this.getExtension( 'OES_texture_float', true );

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, _format || gl.RGBA, _width, _height, 0, _format || gl.RGBA, gl.FLOAT, new Float32Array( _source ) );
    if ( !this.getExtension( 'OES_texture_float_linear' ) ) { this.textureFilter( _texture, gl.NEAREST ); }
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Copy pixels from current framebuffer to given texture.
   * @param {WebGLTexture} _texture Target texture object
   * @param {GLsizei} _width Width of the texture
   * @param {GLsizei} _height Height of the texture
   * @returns {void} void
   */
  copyTexture( _texture, _width, _height ) {
    const gl = this.gl;

    gl.bindTexture( gl.TEXTURE_2D, _texture );
    gl.copyTexImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, _width, _height, 0 );
    gl.bindTexture( gl.TEXTURE_2D, null );
  }

  /**
   * Create a cubemap texture object.
   * @param {Pixelable[]} _arrayOfImage Array of iamges. Order: `X+`, `X-`, `Y+`, `Y-`, `Z+`, `Z-`
   * @returns {WebGLTexture} Texture object
   */
  createCubemap( _arrayOfImage ) {
    const gl = this.gl;

    const texture = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture );
    for ( let i = 0; i < 6; i ++ ) {
      gl.texImage2D( gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _arrayOfImage[ i ] );
    }
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );

    return texture;
  }

  /**
   * Create a framebuffer object.
   * @param {GLsizei} _width Width of the framebuffer
   * @param {GLsizei} _height Height of the framebuffer
   * @returns {GLCatFramebuffer} Framebuffer object
   */
  createFramebuffer( _width, _height ) {
    const gl = this.gl;

    const framebuffer = {};
    framebuffer.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.framebuffer );

    framebuffer.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, framebuffer.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, framebuffer.depth );

    framebuffer.texture = this.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, framebuffer.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer.texture, 0 );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    return framebuffer;
  }

  /**
   * Resize a framebuffer object.
   * @param {GLCatFramebuffer} Framebuffer object
   * @param {GLsizei} _width Width of the framebuffer
   * @param {GLsizei} _height Height of the framebuffer
   * @returns {void} void
   */
  resizeFramebuffer( _framebuffer, _width, _height ) {
    let it = this;
    let gl = it.gl;

    gl.bindFramebuffer( gl.FRAMEBUFFER, _framebuffer.framebuffer );

    gl.bindRenderbuffer( gl.RENDERBUFFER, _framebuffer.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.bindRenderbuffer( gl.RENDERBUFFER, null );

    gl.bindTexture( gl.TEXTURE_2D, _framebuffer.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
  }

  /**
   * Create a framebuffer object, but Float32 one.
   * @param {GLsizei} _width Width of the framebuffer
   * @param {GLsizei} _height Height of the framebuffer
   * @returns {GLCatFramebuffer} Framebuffer object
   */
  createFloatFramebuffer( _width, _height ) {
    let it = this;
    let gl = it.gl;

    it.getExtension( 'OES_texture_float', true );

    let framebuffer = {};
    framebuffer.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer.framebuffer );

    framebuffer.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, framebuffer.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, framebuffer.depth );

    framebuffer.texture = it.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, framebuffer.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.FLOAT, null );
    if ( !it.getExtension( 'OES_texture_float_linear' ) ) { it.textureFilter( framebuffer.texture, gl.NEAREST ); }
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer.texture, 0 );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    return framebuffer;
  }

  /**
   * Resize a float framebuffer object.
   * @param {GLCatFramebuffer} Framebuffer object
   * @param {GLsizei} _width Width of the framebuffer
   * @param {GLsizei} _height Height of the framebuffer
   * @returns {void} void
   */
  resizeFloatFramebuffer( _framebuffer, _width, _height ) {
    let it = this;
    let gl = it.gl;

    gl.bindFramebuffer( gl.FRAMEBUFFER, _framebuffer.framebuffer );

    gl.bindRenderbuffer( gl.RENDERBUFFER, _framebuffer.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.bindRenderbuffer( gl.RENDERBUFFER, null );

    gl.bindTexture( gl.TEXTURE_2D, _framebuffer.texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.FLOAT, null );
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
  }

  /**
   * Create a draw buffers object.  
   * If you can't grab `WEBGL_draw_buffers` extension, you will die instantly.  
   * Format of its textures will be Float32.
   * @param {GLsizei} _width Width of the draw buffers
   * @param {GLsizei} _height Height of the draw buffers
   * @param {number} Specify how many textures it has
   * @returns {GLCatDrawBuffers} Draw buffers object
   */
  createDrawBuffers( _width, _height, _numDrawBuffers ) {
    let it = this;
    let gl = it.gl;

    it.getExtension( 'OES_texture_float', true );
    let ext = it.getExtension( 'WEBGL_draw_buffers', true );

    if ( ext.MAX_DRAW_BUFFERS_WEBGL < _numDrawBuffers ) {
      throw 'createDrawBuffers: MAX_DRAW_BUFFERS_WEBGL is ' + ext.MAX_DRAW_BUFFERS_WEBGL;
    }

    let drawbuffers = {};
    drawbuffers.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, drawbuffers.framebuffer );

    drawbuffers.depth = gl.createRenderbuffer();
    gl.bindRenderbuffer( gl.RENDERBUFFER, drawbuffers.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, drawbuffers.depth );

    drawbuffers.textures = [];
    for ( let i = 0; i < _numDrawBuffers; i ++ ) {
      drawbuffers.textures[ i ] = it.createTexture();
      gl.bindTexture( gl.TEXTURE_2D, drawbuffers.textures[ i ] );
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.FLOAT, null );
      if ( !it.getExtension( 'OES_texture_float_linear' ) ) { it.textureFilter( drawbuffers.textures[ i ], gl.NEAREST ); }
      gl.bindTexture( gl.TEXTURE_2D, null );

      gl.framebufferTexture2D( gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL + i, gl.TEXTURE_2D, drawbuffers.textures[ i ], 0 );
    }

    let status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
    if ( status !== gl.FRAMEBUFFER_COMPLETE ) {
      throw 'createDrawBuffers: gl.checkFramebufferStatus( gl.FRAMEBUFFER ) returns ' + status;
    }
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    return drawbuffers;
  }

  /**
   * Resize a draw buffers object.
   * @param {GLCatDrawBuffers} Draw buffers object
   * @param {GLsizei} _width Width of the draw buffers
   * @param {GLsizei} _height Height of the draw buffers
   * @returns {void} void
   */
  resizeDrawBuffers( _framebuffer, _width, _height ) {
    let it = this;
    let gl = it.gl;

    gl.bindFramebuffer( gl.FRAMEBUFFER, _framebuffer.framebuffer );

    gl.bindRenderbuffer( gl.RENDERBUFFER, _framebuffer.depth );
    gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height );
    gl.bindRenderbuffer( gl.RENDERBUFFER, null );

    for ( let i = 0; i < _framebuffer.textures.length; i ++ ) {
      gl.bindTexture( gl.TEXTURE_2D, _framebuffer.textures[ i ] );
      gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, _width, _height, 0, gl.RGBA, gl.FLOAT, null );
      gl.bindTexture( gl.TEXTURE_2D, null );
    }

    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
  }

  /**
   * Call this before you are going to use draw buffers.
   * @param {number} Specify how many draw buffers you are going to use
   * @returns {void} void
   */
  drawBuffers( _numDrawBuffers ) {
    let it = this;
    let gl = it.gl;

    let ext = it.getExtension( 'WEBGL_draw_buffers', true );

    let array = [];
    if ( typeof _numDrawBuffers === 'number' ) {
      for ( let i = 0; i < _numDrawBuffers; i ++ ) {
        array.push( ext.COLOR_ATTACHMENT0_WEBGL + i );
      }
    } else {
      array = array.concat( _numDrawBuffers );
    }
    ext.drawBuffersWEBGL( array );
  }

  /**
   * Clear current framebuffer.
   * @param {GLclampf} [_r=0.0] Red amount of clearing color
   * @param {GLclampf} [_g=0.0] Green amount of clearing color
   * @param {GLclampf} [_b=0.0] Blue amount of clearing color
   * @param {GLclampf} [_a=1.0] Alpha amount of clearing color
   * @param {GLclampf} [_depth=1.0] Clearing depth
   * @returns {void} void
   */
  clear( _r, _g, _b, _a, _depth ) {
    let it = this;
    let gl = it.gl;

    let r = _r || 0.0;
    let g = _g || 0.0;
    let b = _b || 0.0;
    let a = typeof _a === 'number' ? _a : 1.0;
    let depth = typeof _depth === 'number' ? _depth : 1.0;

    gl.clearColor( r, g, b, a );
    gl.clearDepth( depth );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  }
};

export default GLCat;