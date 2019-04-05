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

    (ctx as any).devicePixelRatio = opts.devicePixelRatio;
    const plot = this.plot = echarts.init(canvas as any, theme, opts);
    (plot as any)._api.saveAsImage = async opts => {
      const { title, type } = opts;
      const blob = await this.getDom().convertToBlob({
        type: 'image/' + type,
      });
      ctx.postMessage(['saveAsImage', {
        blob,
        fileName: `${title}.${type}`,
      }]);
    };
  }

  addEventListener(type: string) {
    this.plot.off(type);
    this.plot.on(type, params => {
      params.event = undefined;
      ctx.postMessage(['event', params]);
    });
  }

  removeEventListener(type: string) {
    this.plot.off(type);
  }

  event(type: string, eventInitDict: object) {
    this.plot.getDom().dispatchEvent(Object.assign(new Event(type), eventInitDict));
  }

  callMethod(methodName: string, ...args: any[]) {
    this.plot[methodName](...args);
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
  ctx.postMessage(['finish', events[msg.data.type](...msg.data.args)]);
};
