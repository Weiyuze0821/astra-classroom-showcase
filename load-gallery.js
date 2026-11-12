(() => {
  const progress = document.querySelector('#loader-progress');
  const detail = document.querySelector('#loader-detail');
  const message = document.querySelector('#loader-message');
  const retry = document.querySelector('#loader-retry');
  const downloaded = new Map();
  const received = new Map();
  let manifest;

  function report() {
    const total = Object.values(manifest).reduce((sum, size) => sum + size, 0);
    const bytes = [...received.values()].reduce((sum, size) => sum + size, 0);
    const percent = Math.min(100, Math.floor(bytes / total * 100));
    progress.value = percent;
    detail.textContent = `${percent}% · ${(bytes / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`;
  }

  async function download(url) {
    if (downloaded.has(url)) return;
    received.set(url, 0);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Asset request failed: ${response.status}`);
    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      received.set(url, received.get(url) + value.byteLength);
      report();
    }
    const blob = new Blob(chunks, {type: response.headers.get('content-type') || 'application/octet-stream'});
    downloaded.set(url, URL.createObjectURL(blob));
  }

  async function prepareMedia() {
    const images = [...document.querySelectorAll('img[data-src]')];
    for (const image of images) image.src = downloaded.get(image.dataset.src);
    await Promise.all(images.map(image => image.decode()));
    const videos = [...document.querySelectorAll('video[data-src]')];
    await Promise.all(videos.map(video => new Promise((resolve, reject) => {
      const finish = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(new Error('Video decode failed')); };
      const cleanup = () => {
        video.removeEventListener('loadeddata', finish);
        video.removeEventListener('error', fail);
      };
      video.addEventListener('loadeddata', finish);
      video.addEventListener('error', fail);
      if (video.dataset.poster) video.poster = downloaded.get(video.dataset.poster);
      video.preload = 'auto';
      video.src = downloaded.get(video.dataset.src);
      video.load();
    })));
    await document.fonts.ready;
    document.body.classList.add('media-ready');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // The opening has its own coordinated playback; resume only inline videos here.
      videos.filter(video => video.dataset.autoplay && !video.closest('.opening-showcase'))
        .forEach(video => video.play().catch(() => { video.controls = true; }));
    }
  }

  async function start() {
    retry.hidden = true;
    message.textContent = '正在准备完整画面，加载完成后自动进入。';
    try {
      if (!manifest) {
        const response = await fetch('media-manifest.json');
        if (!response.ok) throw new Error('Manifest unavailable');
        manifest = await response.json();
      }
      const queue = Object.keys(manifest)[Symbol.iterator]();
      const worker = async () => {
        for (const url of queue) await download(url);
      };
      const results = await Promise.allSettled(Array.from({length: 4}, worker));
      if (results.some(result => result.status === 'rejected')) throw new Error('Asset download failed');
      message.textContent = '画面已下载，正在准备播放。';
      await prepareMedia();
    } catch (error) {
      message.textContent = '部分画面未能加载，请检查网络后重试。';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', start);
  start();
})();
