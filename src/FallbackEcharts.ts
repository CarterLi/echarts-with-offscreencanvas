import echarts from './echarts.js';
import type { IECharts } from './IEcharts';

export class FallbackEcharts implements IECharts {
  private _plot: echarts.ECharts = null;

  async registerTheme(name: string, theme: Record<string, any>) {
    echarts.registerTheme(name, theme);
  }

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

  async setOption(option: Record<string, any>, ...args: any[]) {
    return this._plot.setOption(option, ...args);
  }

  async dispatchAction(payload: Record<string, any>) {
    return this._plot.dispatchAction(payload);
  }

  async resize(opts?: echarts.EChartsResizeOption) {
    this._plot.resize(opts);
  }

  dispose() {
    this._plot.dispose();
  }
}
