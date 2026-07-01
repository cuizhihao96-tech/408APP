/* ===== 408 刷题助手 - 全局状态与工具函数 ===== */
(function() {
  // ========== 存储键 ==========
  const STORAGE_KEY = '408_wrong_ids';
  const LEARNED_KEY = '408_learned_ids';
  const PROGRESS_KEY = '408_progress';
  const FAV_KEY = '408_fav_ids';
  const DAILY_KEY = '408_daily_log';

  // ========== 核心状态 ==========
  window.questions = [];
  window.mode = 'all';
  window.currentSubject = null;
  window.currentChapter = null;
  window.quizList = [];
  window.quizIndex = 0;
  window.reviewMode = false;
  window.isPinned = true;
  window.wrongIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  window.learnedIds = new Set(JSON.parse(localStorage.getItem(LEARNED_KEY) || '[]'));
  window.favIds = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'));
  window.progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  window.dailyLog = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');

  // ========== 科目配置 ==========
  window.subjects = [
    { key: '操作系统',      name: '操作系统', icon: '\u{1F5A5}', color: 'var(--os)' },
    { key: '数据结构',      name: '数据结构', icon: '\u{1F332}', color: 'var(--ds)' },
    { key: '计算机组成原理', name: '计组',     icon: '\u{1F527}', color: 'var(--co)' },
    { key: '计算机网络',    name: '计网',     icon: '\u{1F310}', color: 'var(--cn)' },
  ];

  // ========== 持久化 ==========
  window.saveWrong = function() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...window.wrongIds])); };
  window.saveLearned = function() { localStorage.setItem(LEARNED_KEY, JSON.stringify([...window.learnedIds])); };
  window.saveFav = function() { localStorage.setItem(FAV_KEY, JSON.stringify([...window.favIds])); };
  window.saveProgress = function() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(window.progress)); };
  window.saveDailyLog = function() { localStorage.setItem(DAILY_KEY, JSON.stringify(window.dailyLog)); };

  // ========== 科目进度 ==========
  window.getSubjectProgress = function(subject) {
    var list = window.subjectQuestions.get(subject);
    var total = list ? list.length : 0;
    var done = window.progress[subject] || 0;
    return { done: Math.min(done, total), total: total };
  };

  // ========== 工具函数 ==========
  window.escapeHtml = function(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  window.switchView = function(viewId) {
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(viewId).classList.add('active');
    document.removeEventListener('keydown', window.onQuizKeydown);
  };

  // ========== Toast 组件 ==========
  var toastTimer = null;
  window.showToast = function(msg, type) {
    type = type || '';
    var existing = document.getElementById('toast-el');
    if (existing) existing.remove();
    if (toastTimer) clearTimeout(toastTimer);
    var el = document.createElement('div');
    el.id = 'toast-el';
    el.className = 'toast toast-' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function() { el.classList.add('visible'); });
    toastTimer = setTimeout(function() {
      el.classList.remove('visible');
      setTimeout(function() { el.remove(); }, 300);
    }, 2500);
  };

  // ========== Modal 组件 ==========
  window.showModal = function(title, message, onOk, onCancel, okText, cancelText) {
    okText = okText || '确定';
    cancelText = cancelText || '取消';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<div class="modal-title">' + window.escapeHtml(title) + '</div>' +
        '<div class="modal-message">' + window.escapeHtml(message) + '</div>' +
        '<div class="modal-btns">' +
          '<button class="btn-secondary" id="modal-cancel">' + cancelText + '</button>' +
          '<button class="btn-primary" id="modal-ok">' + okText + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('visible'); });

    var close = function() {
      overlay.classList.remove('visible');
      setTimeout(function() { overlay.remove(); }, 200);
    };

    overlay.querySelector('#modal-ok').onclick = function() { close(); if (onOk) onOk(); };
    overlay.querySelector('#modal-cancel').onclick = function() { close(); if (onCancel) onCancel(); };
  };
})();
