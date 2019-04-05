function copyByKeys(data: object, keys: string[]) {
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

export class OffscreenEcharts implements IECharts {
  private _worker = new Worker('dist/worker.js');
  private _eventTarget = document.createDocumentFragment();
  private _eventsMap: { [type: string]: number } = {};
  private _promise = Promise.resolve<any>(undefined);

  constructor() {
    this._worker.addEventListener('message', e => {
      console.assert(Array.isArray(e.data), 'Unknown message type posted: ', e);
      const [type, data] = e.data;
      switch (type) {
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
    });
  }

  async on(type: string, listener: (event: Event) => void) {
    if (!this._eventsMap[type]) {
      this._eventsMap[type] = 0;
      await this.postMessage({
        type: 'addEventListener',
        args: [type],
      });
    }
    console.assert(this._eventsMap[type] >= 0, 'Something must be wrong');
    this._eventTarget.addEventListener(type, listener);
    ++this._eventsMap[type];
    return { type, listener };
  }

  async off(indicator: { type: string; listener: (e: Event) => void }) {
    if (!indicator.type) return
    const { type, listener } = indicator;
    if (this._eventsMap[type] === 1) {
      await this.postMessage({
        type: 'removeEventListener',
        args: [type],
      });
    }
    console.assert(this._eventsMap[type] > 0, 'Something must be wrong');
    this._eventTarget.removeEventListener(type, listener);
    indicator.type = null;
    indicator.listener = null;
    --this._eventsMap[type];
  }

  async init(div: HTMLDivElement, theme: string) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width: 100%; height: 100%; margin: 0; user-select: none; border: 0;';
    canvas.width = div.clientWidth;
    canvas.height = div.clientHeight;
    div.appendChild(canvas);

    const offscreen = canvas.transferControlToOffscreen();

    await this.postMessage({
      type: 'init',
      args: [offscreen, theme, { devicePixelRatio }],
    }, [offscreen as any]);

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

  callMethod(methodName: string, ...args: any[]) {
    return this.postMessage({
      type: 'callMethod',
      args: [methodName, ...args],
    });
  }

  async terminate(disposeEchartsFirst = true) {
    if (disposeEchartsFirst) await this.postMessage('dispose');
    this._worker.terminate();
  }

  /** Post message into worker thread; returned promise is resolved when get message back */
  private postMessage(message: any, transfer?: Transferable[]) {
    return this._promise = this._promise.finally(() => {
      return new Promise((resolve, reject) => {
        this._worker.addEventListener('message', function onMessage(e) {
          console.assert(Array.isArray(e.data), 'Unknown message type posted: ', e);
          const [type, data] = e.data;
          switch (type) {
            case 'resolve': {
              resolve(data);
              this.removeEventListener('message', onMessage);
              break;
            }
            case 'reject': {
              reject(data);
              this.removeEventListener('message', onMessage);
              break;
            }
            case 'error': {
              const [name, message, stack] = data as [string, string, string];
              const error: Error = new self[name](message);
              error.stack = stack;
              reject(error);
              this.removeEventListener('message', onMessage);
              break;
            }
          }
        });
        this._worker.postMessage(message, transfer);
      });
    });
  }
}
