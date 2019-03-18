// Hack echarts
this.window = this;
this.addEventListener = function () {};

importScripts('./echarts.js');

/** @type {HTMLCanvasElement} canvas */
let canvas;

const events = {
  async init(c) {
    canvas = c;
    echarts.setCanvasCreator(function () {
      return new OffscreenCanvas(32, 32);
    });

    const plot = echarts.init(canvas);
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

  event(type, eventInitDict) {
    canvas.dispatchEvent(Object.assign(new Event(type), eventInitDict));
  }
}

onmessage = msg => {
  events[msg.data.type](...msg.data.args);
};
