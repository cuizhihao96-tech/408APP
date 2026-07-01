/* ===== 408 刷题助手 - 键盘快捷键模块 ===== */
(function() {
  function onQuizKeydown(e) {
    if (!document.getElementById('quiz-view').classList.contains('active')) return;
    var body = document.getElementById('quiz-body');
    var opts = body.querySelectorAll('.quiz-option:not(.disabled)');

    if (opts.length > 0) {
      var keys = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      var idx = keys[e.key.toLowerCase()];
      if (idx !== undefined && opts[idx]) {
        e.preventDefault();
        opts[idx].click();
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      var btnNext = body.querySelector('.btn-next');
      var btnShow = body.querySelector('#btn-show');
      if (btnNext) btnNext.click();
      else if (btnShow && btnShow.style.display !== 'none') btnShow.click();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      goBackToHome();
    }
  }

  function goBackToHome() {
    window.switchView('home-view');
    window.renderHome();
    window.currentSubject = null;
    window.currentChapter = null;
    var chapterSelect = document.getElementById('chapter-select');
    if (chapterSelect) chapterSelect.style.display = 'none';
    document.getElementById('subject-grid').style.display = '';
    document.getElementById('home-actions').style.display = '';
    document.getElementById('home-stats').style.display = '';
  }

  window.onQuizKeydown = onQuizKeydown;
  window.goBackToHome = goBackToHome;
})();
