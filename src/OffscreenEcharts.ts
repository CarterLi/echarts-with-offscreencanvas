import { stringify } from './SafeJson.js';
import type { IECharts } from './IEcharts';
import echarts from './echarts.js';

function copyByKeys(data: Record<string, any>, keys: string[]) {
  const result = {};
  keys.forEach(x => {
    if (x in data) result[x] = data[x];
  });
  return result;
}

const mouseEventKeys = [
  'zrX', 'zrY', 'zrDelta', 'which', 'button',
];
const mouseEventNames = [
  'click', 'dblclick', 'mousewheel', 'mouseout',
  'mouseup', 'mousedown', 'contextmenu',
];

export class OffscreenEcharts implements IECharts {
  private _worker = new Worker('dist/renderer.worker.js', { type: 'module' });
  private _eventTarget = document.createDocumentFragment();
  private _eventsMap: { [type: string]: number } = {};
  private _promise = Promise.resolve<any>(undefined);
  private _canvas: HTMLCanvasElement;
  private _tooltip: HTMLDivElement;

  constructor() {
    this._worker.addEventListener('message', e => {
      console.assert(Array.isArray(e.data), 'Unknown message type posted: ', e);
      const [msgType, data] = e.data as [string, any];
      switch (msgType) {
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
          const $a = document.createElement('a');
          $a.download = `${data.title}.${data.type}`;
          $a.target = '_blank';
          $a.href = this._canvas.toDataURL('image/' + data.type);
          $a.click();
          break;
        }
        case 'tooltip': {
          const { type, param } = data;
          switch (type) {
            case 'init': {
              const container = this._canvas.parentElement as HTMLDivElement;
              const div = this._tooltip = document.createElement('div');
              const appendToBody = param.appendToBody as boolean;
              Object.assign(div.style, {
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 9999999,
                display: 'none',
                whiteSpace: 'pre-wrap',
                transitionProperty: 'transform',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                borderRadius: '4px',
                borderStyle: 'solid',
                pointerEvents: 'none',
                contain: 'content',
              });
              if (appendToBody) {
                document.body.append(div);
              } else {
                container.style.position = 'relative';
                container.appendChild(div);
              }
              break;
            }
            case 'show': {
              const div = this._tooltip;
              Object.assign(div.style, param as CSSStyleDeclaration);
              if (this._tooltip.parentElement !== document.body) {
                div.style.display = 'block';
              }
              if (param.extraCssText) {
                div.style.cssText += param.extraCssText;
              }
              break;
            }
            case 'setContent':
              this._tooltip.innerHTML = param;
              break;
            case 'moveTo':
              const { style } = this._tooltip;
              if (this._tooltip.parentElement === document.body) {
                const container = this._canvas.parentElement as HTMLDivElement;
                const { left, top } = container.getBoundingClientRect();
                style.display = 'block';
                style.transform = `translate(${left + param[0]}px, ${top + param[1]}px)`;
              } else {
                style.transform = `translate(${param[0]}px, ${param[1]}px)`;
              }
              break;
            case 'hide':
              this._tooltip.style.display = 'none';
              break;
            case 'dispose':
              this._tooltip.remove();
              this._tooltip = null;
              break;
          }
          break;
        }
        case 'setCursor': {
          this._canvas.style.cursor = data;
        }
      }
    });
  }

  registerTheme(name: string, theme: Record<string, any>) {
    return this.postMessage({
      type: 'registerTheme',
      args: [name, JSON.stringify(theme)],
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
    if (!indicator.type) return;
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
    const canvas = this._canvas = document.createElement('canvas');
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
        args: [e.type, copyByKeys(echarts.normalizeEvent(this._canvas, e), mouseEventKeys)],
      }).then(() => blockEvent = false);
    }, { passive: true });

    mouseEventNames.forEach(eventType => {
      canvas.addEventListener(eventType, (e: MouseEvent | MouseWheelEvent) => {
        this.postMessage({
          type: 'event',
          args: [e.type, copyByKeys(echarts.normalizeEvent(this._canvas, e), mouseEventKeys)],
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

  setOption(option: Record<string, any>, ...args: any[]) {
    return this.postMessage({
      type: 'setOption',
      args: [stringify(option, /^[\$_]/), ...args],
    });
  }

  dispatchAction(payload: Record<string, any>) {
    return this.callMethod('dispatchAction', payload);
  }

  resize(opts?: echarts.EChartsResizeOption) {
    return this.callMethod('resize', opts);
  }

  dispose() {
    // It's an noop of dispose method in worker
    this._worker.terminate();
    this._tooltip?.remove();
  }

  /** Post message into worker thread; returned promise is resolved when get message back */
  private postMessage(message: any, transfer?: Transferable[]) {
    // eslint-disable-next-line arrow-body-style, @typescript-eslint/no-empty-function
    return this._promise = this._promise.catch(() => {}).then(() => {
      return new Promise((resolve, reject) => {
        this._worker.addEventListener('message', function onMessage(e) {
          console.assert(Array.isArray(e.data), 'Unknown message type posted: ', e);
          const [type, data] = e.data as [string, any];
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
              const [name, msg, stack] = data as [string, string, string];
              const error: Error = new self[name](msg);
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
