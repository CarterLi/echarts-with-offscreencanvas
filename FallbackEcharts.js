export class FallbackEcharts {
  constructor() {
    this._canvas = null;
    this._plot = null;
    this._eventTarget = document.createDocumentFragment();
  }

  /** Bind events
   * @param {string} type
   * @param {(event?: Event) => void} listener
   */
  on(type, listener) {
    this._plot.on(type, listener);
    return { type, listener };
  }

  /** Unbind events
   * @param {{ type: string; listener: (e: Event) => void }} indicator
   */
  off(indicator) {
    if (!indicator.type) return

    this._plot.off(indicator.type, indicator.listener);
    indicator.type = null;
    indicator.listener = null;
  }

  /** Init echarts
   * @param {HTMLCanvasElement} canvas
   **/
  init(canvas) {
    this._canvas = canvas;
    this._plot = echarts.init(this._canvas);
  }

  /** @param {string} methodName */
  callMethod(methodName, ...args) {
    return this._plot[methodName](...args);
  }

  terminate() {
    this._plot.dispose();
  }
}
