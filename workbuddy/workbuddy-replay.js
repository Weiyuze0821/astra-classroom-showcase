(() => {
  const root = document.querySelector('#farm-replay');
  const chat = root.querySelector('.replay-conversation');
  const terminal = root.querySelector('.replay-terminal');
  const output = root.querySelector('#replay-command');
  const evidence = root.querySelector('#replay-evidence');
  const toggle = root.querySelector('#replay-toggle');
  const messages = [...root.querySelectorAll('[data-replay-step]')];
  const phases = [...root.querySelectorAll('[data-replay-phase]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const submit = 'rft --json submit --task-id 240839983 --yes';
  const stages = [
    {
      command: [
        'WorkBuddy Read → renderbus-online-submit/SKILL.md',
        '',
        'rft --json analyse run --scene "…/zerog-farm.blend" --config-name 5.1 --frames 1-96 --sync',
        '分析回执：240839983',
      ].join('\n'),
      note: '读取技能并分析本地工程。分析返回任务号，不代表云端已受理。',
    },
    {
      command: [
        submit,
        '',
        'E_DAEMON_UNREACHABLE: submit transfer.upload job',
        '{ "ok": false, "stage": "upload", "task_id": 240839983 }',
      ].join('\n'),
      note: '16:37:52 和 16:38:18 两次返回同一错误，都停在上传。',
    },
    {
      command: [
        'rft daemon run',
        'rft daemon status',
        'running     true',
        '',
        submit,
        'upload  done   6 file(s) / 64.1 MB uploaded',
        'submit  done   Cmd 301 accepted by the cloud for task 240839983',
      ].join('\n'),
      note: '16:39:39 回执：沿用分析生成的任务号，上传完成，云端受理。受理不等于完成渲染。',
    },
    {
      command: [
        'rft --json upload status <upload-job-id>  × 4',
        '4 jobs: status=done, percent=100',
        '',
        'rft --json submit --task-id 240840673 --skip-upload --yes',
        'Cmd 301 accepted by the cloud for task 240840673',
      ].join('\n'),
      note: '16:56：大清单遇到 EOF 后，WorkBuddy 分四批上传。确认全部传完，才对同一任务跳过重复上传。',
    },
    {
      command: [
        'rft --json task get 240839983',
        'done       | 96/96 | failed: 0',
        'rft --json task get 240840393',
        'done       | 96/96 | failed: 0',
        'rft --json task get 240840673',
        'rendering  | 59/96 | failed: 0',
      ].join('\n'),
      note: '17:02：WorkBuddy 查询三项任务。当时洪水仍在渲染。',
    },
    {
      command: [
        'rft --json download submit --task-id 240839983 --dest <zerog>',
        'rft --json download submit --task-id 240840393 --dest <aging>',
        'rft --json download status <download-job-id>  × 2',
        '',
        '下载作业：done × 2',
        '本地输出：96 PNG × 2',
        'WorkBuddy 查看各自第 1、48、96 帧',
      ].join('\n'),
      note: '17:03–17:06：下载状态只确认传输，随后检查磁盘上的帧，并打开六张图验片。',
    },
    {
      command: [
        'rft --json --zone gpu75 task get 240839983',
        'rft --json --zone gpu75 task get 240840393',
        'rft --json --zone gpu75 task get 240840673',
        'done | 96/96 | failed: 0  × 3',
        '',
        'rft --json --zone gpu75 download submit --task-id 240840673 --dest <flood>',
        'rft --json download status <download-job-id>',
        'done → 本地 96 张 PNG',
        '每组 96 帧 PNG 按 24 fps 合成 1080p MP4，每段 4 秒',
      ].join('\n'),
      note: '独立复查：17:08 确认失重和荒废已完成，17:09 确认洪水也已完成，并下载洪水输出后合成验片。',
    },
  ];
  const events = [];
  const stageStarts = [];
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
    chat.scrollTop = chat.scrollHeight;
  }
  function markStep(index) {
    phases.forEach((phase, i) => {
      if (i === index) phase.setAttribute('aria-current', 'step');
      else phase.removeAttribute('aria-current');
    });
  }
  stages.forEach((stage, index) => {
    stageStarts.push(events.length);
    events.push({delay: 150, run: () => markStep(index)});
    const group = messages.filter(message => Number(message.dataset.replayStep) === index);
    group.filter(message => message.classList.contains('user')).forEach(message => {
      events.push({delay: 1000, run: () => reveal(message)});
    });
    events.push({delay: 200, run() {
      focus('terminal'); output.textContent = '';
      evidence.textContent = stage.note;
    }});
    stage.command.split('\n').forEach(line => {
      events.push({delay: line ? 90 : 50, run() { output.textContent += line + '\n'; }});
    });
    group.filter(message => !message.classList.contains('user')).forEach(message => {
      events.push({delay: index === stages.length - 1 ? 5000 : 3000, run: () => reveal(message)});
    });
  });
  function reset() {
    cursor = 0;
    messages.forEach(message => { message.hidden = true; message.classList.remove('is-entering'); });
    phases.forEach(phase => phase.removeAttribute('aria-current'));
    output.textContent = ''; evidence.textContent = ''; chat.scrollTop = 0;
  }
  function advance() {
    if (!playing) return;
    if (cursor === events.length) {
      pause();
      toggle.textContent = '重播回放';
      return;
    }
    const event = events[cursor++];
    event.run();
    timer = setTimeout(advance, event.delay);
  }
  function pause() {
    clearTimeout(timer); playing = false;
    toggle.textContent = '继续回放';
  }
  function showStep(index) {
    pause();
    started = true;
    cursor = stageStarts[index + 1] ?? events.length;
    markStep(index);
    messages.forEach(message => {
      message.hidden = Number(message.dataset.replayStep) > index;
      message.classList.remove('is-entering');
    });
    const first = messages.find(message => Number(message.dataset.replayStep) === index);
    chat.scrollTop = first.offsetTop - 16;
    output.textContent = stages[index].command;
    evidence.textContent = stages[index].note;
    focus('terminal');
    if (cursor === events.length) toggle.textContent = '重播回放';
  }
  function play() {
    if ((!started && reduced) || cursor === events.length) reset();
    started = true; playing = true; toggle.textContent = '暂停回放';
    advance();
  }
  toggle.addEventListener('click', () => playing ? pause() : play());
  root.querySelector('#replay-restart').addEventListener('click', () => { pause(); reset(); play(); });
  phases.forEach((phase, index) => phase.addEventListener('click', () => showStep(index)));
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
