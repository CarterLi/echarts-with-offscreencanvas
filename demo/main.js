const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

function getOffscreenCanvasSupport() {
  if (typeof OffscreenCanvas === 'function') {
    try {
      const offscreen = new OffscreenCanvas(32, 32);
      return !!offscreen.getContext('2d');
    } catch {}
    return false;
  }
}

async function getEchartsAdaptor(forceFallback) {
  if (!forceFallback && getOffscreenCanvasSupport()) {
    const { OffscreenEcharts } = await import('../dist/OffscreenEcharts.js');
    return OffscreenEcharts;
  } else {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = '../dist/echarts.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const { FallbackEcharts } = await import('../dist/FallbackEcharts.js');
    return FallbackEcharts;
  }
}

async function startRender() {
  const forceFallback = document.getElementById('forceFallback').checked;
  const EchartsAdaptor = await getEchartsAdaptor(forceFallback);
  const echarts = new EchartsAdaptor();
  const div = document.getElementById('content');
  div.style.cssText = 'width: 1366px; height: 768px';
  await echarts.init(div);
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
    const options = await fetch('demo/' + file).then(res => res.json());
    await echarts.callMethod('setOption', options, true);
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
};

void function main() {
  if (!getOffscreenCanvasSupport()) {
    document.getElementById('explain').textContent = '您的浏览器不支持 OffscreenCanvas，将自动降级至主线程渲染';
    document.getElementById('forceFallback').disabled = true;
    document.getElementById('forceFallback').checked = true;
  } else {
    document.getElementById('explain').textContent = '您的浏览器支持 OffscreenCanvas，可使用辅助线程渲染图表';
  }
  document.getElementById('start').onclick = () => {
    document.getElementById('startField').disabled = true;
    document.getElementById('optionField').disabled = false;
    startRender();
  };

  let lastTime = 0, fps = document.getElementById('fps');
  requestAnimationFrame(function run(t) {
    fps.textContent = (1000 / (t - lastTime)).toFixed(3) + ' FPS';
    lastTime = t;
    requestAnimationFrame(run);
  });
}();
