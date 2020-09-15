interface Worker {
  importScripts(...urls: string[]): void;
  [key: string]: any;
}

declare namespace echarts {
  function setCanvasCreator(callback: () => HTMLCanvasElement | OffscreenCanvas): void;
  function normalizeEvent(el: HTMLCanvasElement, e: UIEvent, calculate?: boolean): MouseEvent | MouseWheelEvent;
}
