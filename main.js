const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

void async function main() {
  let EchartsAdaptor;
  if (typeof OffscreenCanvas === 'function') {
    const { OffscreenEcharts } = await import('./OffscreenEcharts.js');
    EchartsAdaptor = OffscreenEcharts;
  } else {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = './echarts.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const { FallbackEcharts } = await import('./FallbackEcharts.js');
    EchartsAdaptor = FallbackEcharts;
  }
  const echarts = new EchartsAdaptor();
  await echarts.init(document.querySelector('canvas'), ['click']);
  await echarts.callMethod('showLoading');
  const options = await fetch('./data.json').then(res => res.json());
  await delay(2000);
  await echarts.callMethod('setOption', options);
  await echarts.callMethod('hideLoading');

  const events = [];
  document.getElementById('addEvent').onclick = async () => {
    events.push(await echarts.on('click', e => console.log(e)));
  };
  document.getElementById('delEvent').onclick = () => {
    echarts.off(events.pop());
  };
}();
