export function getOffscreenCanvasSupport() {
  if (typeof OffscreenCanvas === 'function') {
    try {
      const offscreen = new OffscreenCanvas(32, 32);
      return !!offscreen.getContext('2d');
    } catch {}
  }
  return false;
}

export async function getEchartsAdaptor(forceFallback = false) {
  if (!forceFallback && getOffscreenCanvasSupport()) {
    const { OffscreenEcharts } = await import('./OffscreenEcharts.js');
    return OffscreenEcharts;
  } else {
    const { FallbackEcharts } = await import('./FallbackEcharts.js');
    return FallbackEcharts;
  }
}
