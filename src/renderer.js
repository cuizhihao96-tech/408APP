/* ===== 408 刷题助手 - 渲染进程入口 v4 ===== */
(function() {
  var IS_WEB = typeof window.appAPI === 'undefined';

  // 导航绑定
  document.getElementById('btn-quiz-back').addEventListener('click', function() { window.goBackToHome(); });
  document.getElementById('btn-review-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-learned-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-fav-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-stats-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });

  function initQuestions(qs) {
    if (qs && qs.length > 0) {
      window.questions = qs;
      var byId = new Map();
      var bySubject = new Map();
      qs.forEach(function(q) {
        byId.set(q.id, q);
        var list = bySubject.get(q.subject);
        if (!list) { list = []; bySubject.set(q.subject, list); }
        list.push(q);
      });
      window.questionsById = byId;
      window.subjectQuestions = bySubject;
      window.renderHome();
    } else {
      window.showToast('题库加载失败：暂无数据', 'error');
    }
  }

  if (IS_WEB) {
    // Web 模式：从内联脚本加载（questions-data.js 在 index.html 中提前引入）
    initQuestions(window.__QUESTIONS__ || []);
  } else {
    // Electron 模式：通过 IPC 从本地文件加载
    window.appAPI.loadQuestions().then(initQuestions).catch(function(err) {
      window.showToast('题库加载失败：' + (err && err.message ? err.message : '未知错误'), 'error');
    });
  }
})();
