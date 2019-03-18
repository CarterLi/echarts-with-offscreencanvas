import { OffscreenEcharts } from './OffscreenEcharts.js';

const echarts = new OffscreenEcharts();
echarts.init(document.querySelector('canvas'), ['click']);
echarts.on('click', e => console.log(e));
