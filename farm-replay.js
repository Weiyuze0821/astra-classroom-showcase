(() => {
  const root = document.querySelector('#farm-replay');
  const chat = root.querySelector('.replay-conversation');
  const terminal = root.querySelector('.replay-terminal');
  const output = root.querySelector('#replay-command');
  const video = root.querySelector('video');
  const toggle = root.querySelector('#replay-toggle');
  const messages = [...root.querySelectorAll('[data-replay-step]')];
  const phases = [...root.querySelectorAll('[data-replay-phase]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stages = [
    {"command": "核验记录摘要 · 沿用已跑通的流程\n\n前次任务：240500631\n工程：flood_farm.blend\n流程：分析 → 上传 → 提交 → 查询 → 下载", "note": "本次复用洪水任务验证过的 CLI 工作流和分析修复方法，不代表新工程可以跳过环境与资产检查。"},
    {"command": "本次环境核验摘要\n\n本机 Blender：5.1.0\n安装路径：\nC:/Program Files/\nblender-5.1.0-windows-x64\n\n云端配置名：5.1\n云端 Blender：5.1.1\n区域：gpu75\n\n用户完成网页登录后，云端查询恢复。", "note": "这里是实际核验结果的整理，不是伪造的终端原始输出。软件版本、安装路径和云端配置均在分析与提交前核对。"},
    {command: 'C:\\> rft --zone gpu75 submit\n     --task-id 240536419 --yes', note: '打包图像并检查缺失资产；CLI 1.0.7 分析包缺 Blender 模块，在独立临时目录补齐后分析通过。随后修复传输端口配置并沿用已有任务号提交。命令为实际执行内容，换行仅为展示。'},
    {command: '本地回执：连接中断\n\nC:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: rendering\nframes: 96\nframes_failed: 0', note: '提交回执曾报错；随后云端状态与节点日志确认已开始渲染，因此没有重复提交。这里展示查询字段摘要。'},
    {command: 'C:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: rendering\nframes_done: 9\nframes: 96\nframes_failed: 0', note: '实际保存的中途查询：9 帧完成，0 失败。等待过程被压缩，进度不会虚构为连续增长。'},
    {command: 'C:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: done\nframes_done: 96\nframes_failed: 0\n\nC:\\> rft --zone gpu75 download submit\n     --task-id 240536419\n     --dest <本地输出目录>', note: '下载命令中的本机目录已缩写。96 张图片均可读取，尺寸为 1920×1080，抽查第 1、48、96 帧后合成为左侧动画。'}
  ];
  const events = [];
  let timer;
  let cursor = 0;
  let playing = false;
  let started = false;
  const focus = side => {
    chat.classList.toggle('is-active', side === 'chat');
    terminal.classList.toggle('is-active', side === 'terminal');
  };
  function reveal(message) {
    focus('chat');
    message.hidden = false;
    message.classList.add('is-entering');
    chat.scrollTop = message.classList.contains('replay-delivery') ? message.offsetTop - 16 : chat.scrollHeight;
  }
  stages.forEach((stage, index) => {
    events.push({delay: 400, run() {
      phases.forEach((phase, i) => {
        if (i === index) phase.setAttribute('aria-current', 'step');
        else phase.removeAttribute('aria-current');
      });
    }});
    const group = messages.filter(message => Number(message.dataset.replayStep) === index);
    group.filter(message => message.classList.contains('user')).forEach(message => {
      events.push({delay: 1700, run: () => reveal(message)});
    });
    events.push({delay: 500, run() {
      focus('terminal'); output.textContent = '';
      root.querySelector('#replay-evidence').textContent = stage.note;
    }});
    stage.command.split('\n').forEach(line => {
      events.push({delay: line ? 230 : 100, run() { output.textContent += line + '\n'; }});
    });
    group.filter(message => !message.classList.contains('user')).forEach(message => {
      events.push({delay: index === stages.length - 1 ? 11000 : 3300, run() {
        reveal(message);
        if (message.classList.contains('replay-delivery')) {
          video.currentTime = 0;
          video.play().catch(() => { video.controls = true; });
        }
      }});
    });
  });
  function reset() {
    cursor = 0; video.pause(); video.currentTime = 0;
    messages.forEach(message => { message.hidden = true; message.classList.remove('is-entering'); });
    phases.forEach(phase => phase.removeAttribute('aria-current'));
    output.textContent = ''; chat.scrollTop = 0;
  }
  function advance() {
    if (!playing) return;
    if (cursor === events.length) reset();
    const event = events[cursor++];
    event.run();
    timer = setTimeout(advance, event.delay);
  }
  function pause() {
    clearTimeout(timer); playing = false; video.pause();
    toggle.textContent = '继续回放';
  }
  function play() {
    if (!started && reduced) reset();
    started = true; playing = true; toggle.textContent = '暂停回放';
    if (!root.querySelector('.replay-delivery').hidden && !video.ended) video.play().catch(() => { video.controls = true; });
    advance();
  }
  toggle.addEventListener('click', () => playing ? pause() : play());
  root.querySelector('#replay-restart').addEventListener('click', () => { pause(); reset(); play(); });
  reset();
  if (reduced) {
    messages.forEach(message => { message.hidden = false; });
    output.textContent = stages.map(stage => stage.command).join('\n\n');
    toggle.textContent = '播放回放';
  } else {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !started) {
        observer.disconnect(); play();
      }
    }, {threshold: 0.2});
    observer.observe(root);
  }
})();
