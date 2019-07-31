import WebXRPolyfill from 'webxr-polyfill';

export class VRCatSession {
  constructor( session ) {
    this.session = session;
    this.isReady = false;
    this.session.addEventListener( 'end', () => { this.destroy(); } );
  }

  async setup( gl ) {
    this.session.baseLayer = new window.XRWebGLLayer( this.session, gl );

    this.frameOfReference = await this.session.requestFrameOfReference( 'eye-level' );

    this.isReady = true;

    this.session.requestAnimationFrame( ( t, frame ) => this.handleFrame( t, frame ) );
  }

  handleFrame( t, frame ) {
    if ( !this.isReady ) { return; }

    const pose = frame.getDevicePose( this.frameOfReference );

    frame.views.forEach( ( view, index ) => {
      const projectionMatrix = view.projectionMatrix;
      const viewMatrix = pose.getViewMatrix( view );
      const v = this.session.baseLayer.getViewport( view );
      const viewport = [ v.x, v.y, v.width, v.height ];
      if ( this.onFrame ) { this.onFrame( {
        iView: index,
        nView: frame.views.length,
        viewMatrix,
        projectionMatrix,
        viewport
      } ); }
    } );

    this.session.requestAnimationFrame( ( t, frame ) => this.handleFrame( t, frame ) );
  }

  destroy() {
    this.session = null;
    this.frameOfReference = null;
    this.isReady = false;
  }
}

export class VRCat {
  constructor() {
    this.polyfill = new WebXRPolyfill();
    navigator.xr.addEventListener( 'devicechange', () => { this.checkForXRSupport(); } );
    this.checkForXRSupport();
  }

  async checkForXRSupport() {
    this.device = await navigator.xr.requestDevice( 'immersive-vr' )
    .catch( () => {
      return null;
    } );

    this.isSupported = !!this.device;
    if ( this.onDeviceChanged ) {
      this.onDeviceChanged();
    }
  }

  async createSession() {
    if ( !this.device ) {
      throw new Error( 'VRCat: There are no supported immersive-vr device' );
    }

    const session = await this.device.requestSession( { immersive: true } )
    .catch( ( error ) => { throw new Error( 'VRCat: Something went wrong' ); } );
    return new VRCatSession( session );
  }
}
