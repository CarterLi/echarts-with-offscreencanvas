interface IEChartsEventIndicator {
  type: string;
  listener: (event: Event) => void;
}

interface IECharts {
  /** Bind events
   * @param type Event type
   * @param listener Event handler
   * @see https://echarts.baidu.com/api.html#events
   */
  on(type: string, listener: (event: Event) => void): Promise<IEChartsEventIndicator>;

  /** Unbind events
   * @param indicator Object that returned by `on`
   */
  off(indicator: IEChartsEventIndicator): Promise<void>;

  /** Init ECharts instance (renderer)
   * @param el Element holder
   * @param theme Theme
   * @see https://echarts.baidu.com/api.html#echarts.init
   */
  init(el: HTMLDivElement, theme: string): Promise<void>;

  /** Call ECharts method
   * @param methodName Method to be called
   * @param param Params to be passed in
   * @returns Values that returned by ECharts
   * @see https://echarts.baidu.com/api.html#echartsInstance
   */
  callMethod(methodName: string, ...args: any[]): Promise<any>;

  /** Dispose ECharts instance and terminate worker thread */
  terminate(): Promise<void>;
}
