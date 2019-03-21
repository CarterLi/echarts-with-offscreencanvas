import { OffscreenEcharts } from './OffscreenEcharts.js';

const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

void async function main() {
  const echarts = new OffscreenEcharts();
  await echarts.init(document.querySelector('canvas'), ['click']);
  await echarts.callMethod('showLoading');
  echarts.on('click', e => console.log(e));
  const options = await fetch('./data.json').then(res => res.json());
  await delay(2000);
  await echarts.callMethod('setOption', options);
  await echarts.callMethod('hideLoading');
}();
