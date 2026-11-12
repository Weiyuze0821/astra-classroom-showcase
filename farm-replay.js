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
  {
    "command": "核验摘要 · 沿用洪水任务流程\nBlender 路径、版本与云端配置已核对\n图像已打包，缺失项已检查",
    "note": "准备过程压缩展示：用户完成登录；核对本机 5.1.0 与云端 5.1.1，沿用之前的方法补齐分析器并恢复传输服务。"
  },
  {
    "command": "C:\\> rft --zone gpu75 submit\n     --task-id 240536419 --yes\n\n随后查询云端：status: rendering",
    "note": "实际提交命令。回执曾连接中断，随后查询及节点日志确认任务在运行，没有重复提交。"
  },
  {
    "command": "C:\\> rft --json --zone gpu75\n     task get 240536419\n\nstatus: rendering\nframes_done: 9 / 96\nframes_failed: 0",
    "note": "真实查询快照，字段合并展示。中间等待已省略。"
  },
  {
    "command": "查询结果：done · 96 / 96 · 0 失败\n\nC:\\> rft --zone gpu75 download submit\n     --task-id 240536419\n     --dest <本地输出目录>",
    "note": "完成状态为真实查询摘要，目录已缩写。96 张 1080p 图片均可读取，抽查第 1、48、96 帧后合成为左侧成片。"
  }
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
    events.push({delay: 150, run() {
      phases.forEach((phase, i) => {
        if (i === index) phase.setAttribute('aria-current', 'step');
        else phase.removeAttribute('aria-current');
      });
    }});
    const group = messages.filter(message => Number(message.dataset.replayStep) === index);
    group.filter(message => message.classList.contains('user')).forEach(message => {
      events.push({delay: 1000, run: () => reveal(message)});
    });
    events.push({delay: 200, run() {
      focus('terminal'); output.textContent = '';
      root.querySelector('#replay-evidence').textContent = stage.note;
    }});
    stage.command.split('\n').forEach(line => {
      events.push({delay: line ? 90 : 50, run() { output.textContent += line + '\n'; }});
    });
    group.filter(message => !message.classList.contains('user')).forEach(message => {
      events.push({delay: index === stages.length - 1 ? 9500 : index === 0 ? 1600 : 2200, run() {
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
