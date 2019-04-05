interface OffscreenCanvas extends EventTarget {
  /**
   * The OffscreenCanvas() constructor returns a newly instantiated OffscreenCanvas object
   */
  new(width: number, height: number): OffscreenCanvas;

  /**
   * Gets or sets the height of a canvas element on a document.
   */
  height: number;
  /**
   * Gets or sets the width of a canvas element on a document.
   */
  width: number;
  /**
   * Returns an object that provides methods and properties for drawing and manipulating images and graphics on a canvas element in a document. A context object includes information about colors, line widths, fonts, and other graphic parameters that can be drawn on a canvas.
   */
  getContext(contextId: "2d", contextAttributes?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
  getContext(contextId: "webgl" | "experimental-webgl", contextAttributes?: WebGLContextAttributes): WebGLRenderingContext | null;
  getContext(contextId: string, contextAttributes?: {}): CanvasRenderingContext2D | WebGLRenderingContext | null;

  /**
   * Creates a Blob object representing the image contained in the canvas
   */
  convertToBlob(options?: { type: string; quality?: number }): Promise<Blob>;

  /**
   * Creates an ImageBitmap object from the most recently rendered image of the OffscreenCanvas
   */
  transferToImageBitmap(): ImageBitmap;
}

declare const OffscreenCanvas: OffscreenCanvas;

interface HTMLCanvasElement {
  transferControlToOffscreen(): OffscreenCanvas;
}
