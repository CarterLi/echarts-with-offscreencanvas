// Hack echarts
self.window = self;
self.devicePixelRatio = 2;

importScripts('./echarts.js');

echarts.setCanvasCreator(function () {
  return new OffscreenCanvas(32, 32);
});

const events = {
  /** Echarts */
  plot: null,
  /** @param {HTMLCanvasElement} canvas */
  async init(canvas) {
    if (this.plot) throw new Error('Has been initialized');

    const plot = this.plot = echarts.init(canvas);
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

  addEventListener(type) {
    this.plot.off(type);
    this.plot.on(type, params => {
      params.event = undefined;
      postMessage(['event', params]);
    });
  },

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

onmessage = async msg => {
  postMessage(['finish', await events[msg.data.type](...msg.data.args)]);
};

self.open = (...args) => {
  postMessage(['open', args]);
};
