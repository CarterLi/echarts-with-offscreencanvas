const ctx: Worker = self as any;

// Hack echarts
ctx.window = self;

ctx.importScripts('./echarts.js');
echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));

const events = new class WorkerEventHandler {
  plot: echarts.ECharts = null;

  getDom() {
    return this.plot.getDom() as any as OffscreenCanvas;
  }

  init(canvas: OffscreenCanvas, theme: string, opts: any) {
    if (this.plot) throw new Error('Has been initialized');

    ctx.devicePixelRatio = opts.devicePixelRatio;
    const plot = this.plot = echarts.init(canvas as any, theme, opts);
    (plot as any)._api.saveAsImage = async opts => {
      ctx.postMessage(['saveAsImage', opts]);
    };
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

  event(type: string, eventInitDict: object) {
    return this.getDom().dispatchEvent(Object.assign(new Event(type), eventInitDict));
  }

  callMethod(methodName: string, ...args: any[]) {
    return this.plot[methodName](...args);
  }

  dispose() {
    this.plot.dispose();
    this.plot = null;
  }
}

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
