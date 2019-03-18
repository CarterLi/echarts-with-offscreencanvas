const canvas = document.querySelector('canvas');
/** @type {HTMLCanvasElement} */
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('./worker.js');
worker.postMessage({
  type: 'init',
  args: [offscreen],
}, [offscreen]);

/** @param {string[]} keys */
function copyByKeys(data, keys) {
  const result = {};
  keys.forEach(x => {
    if (x in data) result[x] = data[x];
  });
  return result;
}

const mouseEventKeys = ['screenX', 'screenY', 'clientX', 'clientY', 'offsetX', 'offsetY', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'button', 'buttons', 'movementX', 'movementY', 'pageX', 'pageY', 'region', 'which'];
[
  'click', 'dblclick', 'mouseover', 'mouseout', 'mousemove',
  'mousedown', 'mouseup', 'globalout', 'contextmenu',
].forEach(eventType => {
  canvas.addEventListener(eventType, e => {
    worker.postMessage({
      type: 'event',
      args: [e.type, copyByKeys(e, mouseEventKeys)],
    });
  });
});
