export interface IEChartsEventIndicator {
  type: string;
  listener: (event: Event) => void;
}

export interface IECharts {
  /** Bind events
   *
   * @param type Event type
   * @param listener Event handler
   * @see https://echarts.baidu.com/api.html#events
   */
  on(type: string, listener: (event: Event) => void): Promise<IEChartsEventIndicator>;

  /** Unbind events
   *
   * @param indicator Object that returned by `on`
   */
  off(indicator: IEChartsEventIndicator): Promise<void>;

  /** Init ECharts instance (renderer)
   *
   * @param el Element holder
   * @param theme Theme
   * @see https://echarts.baidu.com/api.html#echarts.init
   */
  init(el: HTMLDivElement, theme: string): Promise<void>;

  /** Call ECharts method
   *
   * @param methodName Method to be called
   * @param param Params to be passed in
   * @returns Values that returned by ECharts
   * @see https://echarts.baidu.com/api.html#echartsInstance
   */
  callMethod(methodName: string, ...args: any[]): Promise<any>;

  /**
   * Set echarts option
   *
   * @param option Configuration item and data
   * @param args Other params to be passed in
   * @see https://echarts.baidu.com/api.html#echartsInstance.setOption
   */
  setOption(option: Record<string, any>, ...args: any[]): Promise<void>;

  /**
   * Trigger chart action
   *
   * @param payload can trigger multiple actions through batch attribute
   */
  dispatchAction(payload: Record<string, any>): Promise<void>;

  /** Resize chart, which should be called manually when container size changes */
  resize(opts?: echarts.EChartsResizeOption): Promise<void>;

  /** Dispose ECharts instance and terminate worker thread */
  dispose(): void;

  /** Register theme */
  registerTheme(name: string, theme: Record<string, any>): Promise<void>;
}
