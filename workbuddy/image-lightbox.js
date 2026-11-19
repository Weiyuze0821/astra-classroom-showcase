(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-lightbox';
  dialog.setAttribute('aria-label', '图片放大预览');
  dialog.innerHTML = '<div class="image-lightbox-bar"><span>图片预览 · 点击外侧或按 Esc 关闭</span><button type="button" class="image-lightbox-close" aria-label="关闭图片预览" autofocus>×</button></div><img alt=""><p class="image-lightbox-caption"></p>';
  document.body.append(dialog);
  const preview = dialog.querySelector('img');
  const caption = dialog.querySelector('.image-lightbox-caption');
  let opener;
  function open(image, trigger) {
    opener = trigger;
    // Reuse the loaded blob URL on the published page; do not download it again.
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt;
    caption.textContent = image.alt;
    document.documentElement.classList.add('image-preview-open');
    dialog.showModal();
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('image-preview-open');
    preview.removeAttribute('src');
    opener?.focus({preventScroll: true});
  });
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
