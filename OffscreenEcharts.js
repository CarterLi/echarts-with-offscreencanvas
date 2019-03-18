/** @param {string[]} keys */
function copyByKeys(data, keys) {
  const result = {};
  keys.forEach(x => {
    if (x in data) result[x] = data[x];
  });
  return result;
}

const mouseEventKeys = ['screenX', 'screenY', 'clientX', 'clientY', 'offsetX', 'offsetY', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'button', 'buttons', 'movementX', 'movementY', 'pageX', 'pageY', 'region', 'which'];
const mouseEventNames = ['click', 'dblclick', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'mouseup', 'globalout', 'contextmenu'];

export class OffscreenEcharts {
  /** @type {HTMLCanvasElement} */
  _canvas;
  _worker = new Worker('./worker.js');
  _queue = [];
  _eventTarget = document.createDocumentFragment();

  constructor() {
    this._worker.onmessage = e => {
      if (!Array.isArray(e.data)) throw new Error('Unknown message type posted', e);
      const [type, data] = e.data;
      switch (type) {
        case 'finish':
          this._queue.shift().resolve(data);
          break;
        case 'event': {
          const { type } = data;
          delete data.type;
          this._eventTarget.dispatchEvent(Object.assign(new Event(type), data));
          break;
        }
      }
    };
    this._worker.onerror = e => this._queue.shift().reject(e.error);
  }

  /** Bind events
   * @param {string} type
   * @param {(event?: CustomEvent<any[]>) => void} listener
   */
  on(type, listener) {
    this._eventTarget.addEventListener(type, listener);
    return { event, listener };
  }

  /** Unbind events
   * @param {{ event: string; listener: (e: CustomEvent<any[]>) => void }} indicator
   */
  off(indicator) {
    if (!indicator.event) return

    this._eventTarget.removeEventListener(indicator.event, indicator.listener);
    indicator.event = null;
    indicator.listener = null;
  }

  postMessage(...args) {
    return new Promise((resolve, reject) => {
      this._queue.push({ resolve, reject });
      this._worker.postMessage(...args);
    });
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} events2listen
   **/
  async init(canvas, events2listen = []) {
    this._canvas = canvas;

    /** @type {HTMLCanvasElement} */
    const offscreen = canvas.transferControlToOffscreen();

    await this.postMessage({
      type: 'init',
      args: [offscreen],
    }, [offscreen]);

    mouseEventNames.map(eventType => {
      canvas.addEventListener(eventType, e => {
        this.postMessage({
          type: 'event',
          args: [e.type, copyByKeys(e, mouseEventKeys)],
        });
      });
    });

    return Promise.all(events2listen.map(x => this.postMessage({
      type: 'addEventListener',
      args: [x],
    })));
  }

  /** @param {string} methodName */
  callMethod(methodName, ...args) {
    return this.postMessage({
      type: 'callMethod',
      args: [methodName, ...args],
    });
  }

  async terminate(disposeEchartsFirst = true) {
    if (disposeEchartsFirst) await this.postMessage('dispose');
    this._worker.terminate();
  }
}
