/** @param {string[]} keys */
function copyByKeys(data, keys) {
  const result = {};
  keys.forEach(x => {
    if (x in data) result[x] = data[x];
  });
  return result;
}

const mouseEventKeys = ['clientX', 'clientY', 'offsetX', 'offsetY', 'button', 'which', 'wheelDelta', 'detail'];
const mouseEventNames = [
  'click', 'dblclick', 'mousewheel', 'mouseout',
  'mouseup', 'mousedown', 'contextmenu',
];

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
        case 'finish': {
          this._queue.shift().resolve(data);
          break;
        }
        case 'event': {
          const { type } = data;
          delete data.type;
          this._eventTarget.dispatchEvent(Object.assign(new Event(type), data));
          break;
        }
        case 'open': {
          open(...data);
          break;
        }
        case 'saveAsImage': {
          var $a = document.createElement('a');
          $a.download = data.fileName;
          $a.target = '_blank';
          $a.href = URL.createObjectURL(data.blob);
          var evt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
          });
          $a.dispatchEvent(evt);
          setTimeout(() => URL.revokeObjectURL($a.href));
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

    // In order not to push too many (mousemove) events in queue,
    // we will prevent new events from responding before
    // previous event is handled.
    let blockEvent = false;
    canvas.addEventListener('mousemove', e => {
      if (blockEvent) {
        console.warn('Blocking mousemove event', e);
        return;
      }
      blockEvent = true;
      this.postMessage({
        type: 'event',
        args: [e.type, copyByKeys(e, mouseEventKeys)],
      }).then(() => blockEvent = false);
    }, { passive: true });

    mouseEventNames.map(eventType => {
      canvas.addEventListener(eventType, e => {
        this.postMessage({
          type: 'event',
          args: [e.type, copyByKeys(e, mouseEventKeys)],
        });
      }, { passive: true });
    });

    await Promise.all(events2listen.map(x => this.postMessage({
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
