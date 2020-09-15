/* eslint-disable max-classes-per-file */
import { parse } from './SafeJson.js';
import echarts from './echarts.js';

echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));

const ctx: Worker = self as any;

class TooltipContent {
  private _isShow = false;
  static readonly newLine = '\n';

  constructor(param: Record<string, any>) {
    ctx.postMessage(['tooltip', {
      type: 'init',
      param,
    }]);
  }

  update() {
    // empty
  }

  show(tooltipModel) {
    this._isShow = true;
    const textStyleModel = tooltipModel.getModel('textStyle');
    ctx.postMessage(['tooltip', {
      type: 'show',
      param: {
        transitionDuration: tooltipModel.get('transitionDuration') + 's',
        backgroundColor: tooltipModel.get('backgroundColor'),
        color: textStyleModel.getTextColor(),
        font: textStyleModel.getFont(),
        fontSize: textStyleModel.get('fontSize') + 'px',
        textDecoration: textStyleModel.get('decoration'),
        textAlign: textStyleModel.get('align'),
        padding: tooltipModel.get('padding') + 'px',
        borderColor: tooltipModel.get('borderColor'),
        borderWidth: tooltipModel.get('borderWidth'),
        extraCssText: tooltipModel.get('extraCssText'),
      },
    }]);
  }

  setContent(content: string) {
    ctx.postMessage(['tooltip', {
      type: 'setContent',
      param: content,
    }]);
  }

  setEnterable(_enterable: boolean) {
    // unimplemented
  }

  getSize() {
    return [0,0];
  }

  moveTo(zrX: number, zrY: number) {
    ctx.postMessage(['tooltip', {
      type: 'moveTo',
      param: [zrX, zrY],
    }]);
  }

  hide() {
    if (this._isShow) {
      this._isShow = false;
      ctx.postMessage(['tooltip', {
        type: 'hide',
      }]);
    }
  }

  hideLater(_time: number) {
    if (this._isShow) {
      setTimeout(() => this.hide(), _time);
    }
  }

  isShow() {
    return this._isShow;
  }

  dispose() {
    ctx.postMessage(['tooltip', {
      type: 'dispose',
    }]);
  }

  getOuterSize() {
    return [0,0];
  }
}

const events = new class WorkerEventHandler {
  plot: echarts.ECharts = null;

  init(canvas: OffscreenCanvas, theme: string, opts: any) {
    if (this.plot) throw new Error('Has been initialized');

    ctx.devicePixelRatio = opts.devicePixelRatio;
    const plot = this.plot = echarts.init(canvas as any, theme, opts);
    (plot as any)._api.saveAsImage = (args: any) => {
      ctx.postMessage(['saveAsImage', args]);
    };
    (plot as any).getZr().handler.proxy.setCursor = (cursorStyle: string) => {
      ctx.postMessage(['setCursor', cursorStyle]);
    };
  }

  registerTheme(name: string, theme: string) {
    echarts.registerTheme(name, JSON.parse(theme));
  }

  addEventListener(type: string) {
    this.plot.off(type);
    return this.plot.on(type, params => {
      params.event = undefined;
      ctx.postMessage(['event', params]);
    });
  }

  removeEventListener(type: string) {
    return this.plot.off(type);
  }

  event(type: string, eventInitDict: Record<string, any>) {
    return (this.plot as any).getZr().handler.dispatch(type, eventInitDict);
  }

  callMethod(methodName: string, ...args: any[]) {
    return this.plot[methodName](...args);
  }

  setOption(json: string, ...args: any[]) {
    const option = parse(json);
    if (option.tooltip && typeof option.tooltip === 'object' && !option.tooltip.renderMode) {
      option.tooltip.renderMode = 'html';
      option.tooltip.renderer = TooltipContent;
    }
    return this.plot.setOption(option, ...args);
  }

  dispose() {
    this.plot.dispose();
    this.plot = null;
  }
}();

ctx.open = (...args: any[]) => {
  ctx.postMessage(['open', args]);
};

ctx.onmessage = msg => {
  try {
    ctx.postMessage(['resolve', events[msg.data.type](...msg.data.args)]);
  } catch (e) {
    if (e instanceof Error) {
      ctx.postMessage(['error', [e.name, e.message, e.stack]]);
    } else {
      ctx.postMessage(['reject', e]);
    }
  }
};
