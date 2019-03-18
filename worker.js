// Hack echarts
this.window = this;
this.addEventListener = function () {};

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
    plot.setOption({
      title: {
        text: '堆叠区域图'
      },
      tooltip : {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data:['邮件营销','联盟广告','视频广告','直接访问','搜索引擎']
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: [
        {
          type : 'category',
          boundaryGap : false,
          data : ['周一','周二','周三','周四','周五','周六','周日']
        }
      ],
      yAxis: [
        {
          type : 'value'
        }
      ],
      series: await fetch('./data.json').then(res => res.json())
    });
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
