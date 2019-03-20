// Hack echarts
this.window = this;

importScripts('./echarts.js');

/** @type {HTMLCanvasElement} canvas */
let canvas;

const events = {
  /** Echarts */
  plot: null,
  async init(c) {
    canvas = c;
    echarts.setCanvasCreator(function () {
      return new OffscreenCanvas(32, 32);
    });

    const plot = this.plot = echarts.init(canvas);
    plot.setOption(await fetch('./data.json').then(res => res.json()));
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
    canvas.dispatchEvent(Object.assign(new Event(type), eventInitDict));
  },

  callMethod(methodName, ...args) {
    this.plot[methodName](...args);
  },
}

onmessage = async msg => {
  postMessage(['finish', await events[msg.data.type](...msg.data.args)]);
};

self.open = (...args) => {
  postMessage(['open', args]);
};
