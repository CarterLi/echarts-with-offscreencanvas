// Hack echarts
self.window = self;

importScripts('./echarts.js');

echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));

const events = {
  /** @type {echarts.ECharts} */
  plot: null,
  /** @param {OffscreenCanvas} canvas */
  init(canvas, theme, opts) {
    if (this.plot) throw new Error('Has been initialized');

    self.devicePixelRatio = opts.devicePixelRatio;
    const plot = this.plot = echarts.init(canvas, theme, opts);
    plot._api.saveAsImage = async opts => {
      const { title, type } = opts;
      const blob = await plot.getDom().convertToBlob({
        type: 'image/' + type,
      });
      postMessage(['saveAsImage', {
        blob,
        fileName: `${title}.${type}`,
      }]);
    };
  },

  /** @param {string} type */
  addEventListener(type) {
    this.plot.off(type);
    this.plot.on(type, params => {
      params.event = undefined;
      postMessage(['event', params]);
    });
  },

  /** @param {string} type */
  removeEventListener(type) {
    this.plot.off(type);
  },

  event(type, eventInitDict) {
    this.plot.getDom().dispatchEvent(Object.assign(new Event(type), eventInitDict));
  },

  callMethod(methodName, ...args) {
    this.plot[methodName](...args);
  },

  dispose() {
    this.plot.dispose();
    this.plot = null;
  },
}

onmessage = msg => {
  postMessage(['finish', events[msg.data.type](...msg.data.args)]);
};

self.open = (...args) => {
  postMessage(['open', args]);
};
