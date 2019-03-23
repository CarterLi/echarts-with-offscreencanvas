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
  _worker = new Worker('./worker.js');
  _queue = [];
  _eventTarget = document.createDocumentFragment();
  eventsMap = {};

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
   * @param {(event?: Event) => void} listener
   */
  async on(type, listener) {
    if (!this.eventsMap[type]) {
      this.eventsMap[type] = 0;
      await this.postMessage({
        type: 'addEventListener',
        args: [type],
      });
    }
    console.assert(this.eventsMap[type] >= 0, 'Something must be wrong');
    this._eventTarget.addEventListener(type, listener);
    ++this.eventsMap[type];
    return { type, listener };
  }

  /** Unbind events
   * @param {{ type: string; listener: (e: Event) => void }} indicator
   */
  async off(indicator) {
    if (!indicator.type) return
    const { type, listener } = indicator;
    if (this.eventsMap[type] === 1) {
      await this.postMessage({
        type: 'removeEventListener',
        args: [type],
      });
    }
    console.assert(this.eventsMap[type] > 0, 'Something must be wrong');
    this._eventTarget.removeEventListener(type, listener);
    indicator.event = null;
    indicator.listener = null;
    --this.eventsMap[type];
  }

  postMessage(...args) {
    return new Promise((resolve, reject) => {
      this._queue.push({ resolve, reject });
      this._worker.postMessage(...args);
    });
  }

  /** Init echarts
   * @param {HTMLElement} div
   * @param {string} theme
   **/
  async init(div, theme) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width: 100%; height: 100%; margin: 0; user-select: none; border: 0;';
    canvas.width = div.clientWidth;
    canvas.height = div.clientHeight;
    div.appendChild(canvas);

    /** @type {HTMLCanvasElement} */
    const offscreen = canvas.transferControlToOffscreen();

    await this.postMessage({
      type: 'init',
      args: [offscreen, theme, { devicePixelRatio }],
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

    mouseEventNames.forEach(eventType => {
      canvas.addEventListener(eventType, e => {
        this.postMessage({
          type: 'event',
          args: [e.type, copyByKeys(e, mouseEventKeys)],
        });
      }, { passive: true });
    });
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
