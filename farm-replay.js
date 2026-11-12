(() => {
  const root = document.querySelector('#farm-replay');
  const chat = root.querySelector('.replay-conversation');
  const video = root.querySelector('video');
  const toggle = root.querySelector('#replay-toggle');
  const buttons = [...root.querySelectorAll('[data-replay-jump]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stages = [
    {command: 'C:\\> rft --zone gpu75 submit\n     --task-id 240536419 --yes', note: '沿用分析后创建的任务号，上传资产并提交。命令为实际执行内容，换行仅为展示。'},
    {command: '本地回执：连接中断\n\nC:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: rendering\nframes: 96\nframes_failed: 0', note: '提交回执曾报错；随后云端状态与节点日志确认已开始渲染，因此没有重复提交。这里展示查询字段摘要。'},
    {command: 'C:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: rendering\nframes_done: 9\nframes: 96\nframes_failed: 0', note: '实际保存的中途查询：9 帧完成，0 失败。等待过程被压缩，进度不会虚构为连续增长。'},
    {command: 'C:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: done\nframes_done: 96\nframes_failed: 0\n\nC:\\> rft --zone gpu75 download submit\n     --task-id 240536419\n     --dest <本地输出目录>', note: '下载命令中的本机目录已缩写。96 张图片均可读取，尺寸为 1920×1080，抽查第 1、48、96 帧后合成为左侧动画。'}
  ];
  let step = 0;
  let playing = false;
  let started = false;
  let timer;
  function show(index) {
    step = index;
    root.querySelectorAll('[data-replay-step]').forEach(message => {
      message.hidden = Number(message.dataset.replayStep) > step;
    });
    buttons.forEach((button, i) => {
      if (i === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    root.querySelector('#replay-command').textContent = stages[step].command;
    root.querySelector('#replay-evidence').textContent = stages[step].note;
    chat.scrollTop = step === 3 ? root.querySelector('.replay-delivery').offsetTop - 16 : chat.scrollHeight;
    if (step !== 3) video.pause();
    else if (!reduced) video.play().catch(() => { video.controls = true; });
  }
  function pause() {
    clearTimeout(timer);
    playing = false;
    video.pause();
    toggle.textContent = step === 3 ? '播放成片' : '继续回放';
  }
  function advance() {
    if (step === 3) {
      playing = false;
      toggle.textContent = video.paused ? '播放成片' : '暂停成片';
      return;
    }
    timer = setTimeout(() => { show(step + 1); advance(); }, 6000);
  }
  function play() {
    started = true;
    if (step === 3) { video.play().catch(() => { video.controls = true; }); return; }
    clearTimeout(timer);
    playing = true;
    toggle.textContent = '暂停回放';
    advance();
  }
  toggle.addEventListener('click', () => playing || !video.paused ? pause() : play());
  video.addEventListener('play', () => { if (step === 3) toggle.textContent = '暂停成片'; });
  video.addEventListener('pause', () => { if (step === 3) toggle.textContent = '播放成片'; });
  video.addEventListener('ended', () => { toggle.textContent = '播放成片'; });
  root.querySelector('#replay-restart').addEventListener('click', () => {
    pause(); video.currentTime = 0; show(0); play();
  });
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    started = true; pause(); show(index); toggle.textContent = index === 3 ? (video.paused ? '播放成片' : '暂停成片') : '继续回放';
  }));
  show(0);
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && !started) {
      observer.disconnect();
      if (!reduced) play();
    }
  }, {threshold: 0.2});
  observer.observe(root);
})();
