export class FallbackEcharts implements IECharts {
  private _plot: echarts.ECharts = null;

  async on(type: string, listener: (event: Event) => void) {
    this._plot.on(type, listener);
    return { type, listener };
  }

  async off(indicator: { type: string; listener: (e: Event) => void }) {
    if (!indicator.type) return;

    this._plot.off(indicator.type, indicator.listener);
    indicator.type = null;
    indicator.listener = null;
  }

  async init(el: HTMLDivElement, theme: string) {
    this._plot = echarts.init(el, theme);
  }

  async callMethod(methodName: string, ...args: any[]) {
    return this._plot[methodName](...args);
  }

  async terminate() {
    this._plot.dispose();
  }
}
