const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

async function getEchartsAdaptor() {
  if (typeof OffscreenCanvas === 'function') {
    const { OffscreenEcharts } = await import('./OffscreenEcharts.js');
    return OffscreenEcharts;
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
    return FallbackEcharts;
  }
}

void async function main() {
  const EchartsAdaptor = await getEchartsAdaptor();
  const echarts = new EchartsAdaptor();
  await echarts.init(document.querySelector('canvas'), ['click']);
  function showLoading(loading = true) {
    if (loading) {
      return echarts.callMethod('showLoading', {
        text: '努力加载中',
        color: '#c23531',
        textColor: '#04beb4',
        maskColor: 'rgba(255, 255, 255, 0)',
      });
    } else {
      return echarts.callMethod('hideLoading');
    }
  }
  async function loadData() {
    const file = document.getElementById('dataOption').value;
    await showLoading();
    const options = await fetch(file).then(res => res.json());
    await echarts.callMethod('setOption', options);
    await showLoading(false);
  }
  document.getElementById('loadData').onclick = loadData;

  await showLoading();
  await delay(1000);
  await loadData();

  const events = [];
  document.getElementById('addEvent').onclick = async () => {
    events.push(await echarts.on('click', e => console.log(e)));
  };
  document.getElementById('delEvent').onclick = () => {
    echarts.off(events.pop());
  };
}();
