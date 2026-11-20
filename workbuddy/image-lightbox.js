(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-lightbox';
  dialog.setAttribute('aria-label', '图片放大预览');
  dialog.innerHTML = '<div class="image-lightbox-bar"><span>图片预览 · 点击外侧或按 Esc 关闭</span><button type="button" class="image-lightbox-close" aria-label="关闭图片预览" autofocus>×</button></div><img alt=""><p class="image-lightbox-caption"></p>';
  document.body.append(dialog);
  const preview = dialog.querySelector('img');
  const caption = dialog.querySelector('.image-lightbox-caption');
  const title = dialog.querySelector('.image-lightbox-bar span');
  const closeButton = dialog.querySelector('button');
  const video = document.createElement('video');
  video.controls = true;
  video.loop = true;
  video.playsInline = true;
  video.muted = true;
  const links = [...document.querySelectorAll('a[data-media-preview]')];
  let opener;
  let returnPosition;
  let previousRestoration;
  function show(trigger, label, linked) {
    opener = trigger;
    dialog.classList.toggle('linked-preview', linked);
    title.textContent = linked ? label : '图片预览 · 点击外侧或按 Esc 关闭';
    closeButton.textContent = linked ? '返回文章' : '×';
    closeButton.setAttribute('aria-label', linked ? '返回文章' : '关闭图片预览');
    dialog.setAttribute('aria-label', linked ? label : '图片放大预览');
    document.documentElement.classList.add('image-preview-open');
    dialog.showModal();
  }
  function open(image, trigger) {
    // Reuse the loaded blob URL on the published page; do not download it again.
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt;
    caption.textContent = image.alt;
    show(trigger, image.alt, false);
  }
  function openLink(link) {
    returnPosition = [window.scrollX, window.scrollY];
    previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const label = link.textContent.trim();
    const isVideo = link.dataset.mediaPreview === 'video';
    preview.hidden = isVideo;
    caption.hidden = true;
    if (isVideo) {
      preview.after(video);
      video.setAttribute('aria-label', label);
      video.src = link.href;
    } else {
      preview.src = link.href;
      preview.alt = label;
    }
    show(link, label, true);
    if (isVideo) video.play().catch(() => {});
  }
  function dismiss() {
    if (opener?.matches('a[data-media-preview]') && history.state?.workbuddyPreview) {
      history.back();
    } else {
      dialog.close();
    }
  }
  closeButton.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dismiss();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('image-preview-open');
    preview.removeAttribute('src');
    preview.hidden = false;
    caption.hidden = false;
    if (video.isConnected) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    }
    opener?.focus({preventScroll: true});
    if (returnPosition) {
      window.scrollTo(...returnPosition);
      history.scrollRestoration = previousRestoration;
      returnPosition = null;
    }
  });
  if (links.length) {
    const restorePreview = () => {
      const link = links.find(item => item.getAttribute('href') === history.state?.workbuddyPreview);
      if (link && !dialog.open) openLink(link);
      else if (!link && dialog.open) dialog.close();
    };
    links.forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openLink(link);
        history.pushState({...history.state, workbuddyPreview: link.getAttribute('href')}, '');
      });
    });
    window.addEventListener('popstate', restorePreview);
    restorePreview();
  }
  document.querySelectorAll('.image-zoom').forEach(button => {
    button.addEventListener('click', () => open(button.querySelector('img'), button));
  });
  document.querySelectorAll('figure > img').forEach(image => {
    image.dataset.zoomable = '';
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', '放大图片：' + image.alt);
    image.addEventListener('click', () => open(image, image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); open(image, image);
      }
    });
  });
})();
