/* ===== 408 刷题助手 - 渲染进程入口 v3 ===== */
(function() {

  // 导航绑定
  document.getElementById('btn-quiz-back').addEventListener('click', function() { window.goBackToHome(); });
  document.getElementById('btn-review-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-learned-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-fav-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });
  document.getElementById('btn-stats-back').addEventListener('click', function() { window.switchView('home-view'); window.renderHome(); });

  // 初始化
  window.appAPI.loadQuestions().then(function(qs) {
    if (qs && qs.length > 0) {
      window.questions = qs;

      // 预建索引：id→题、科目→题列表，消除后续 O(n) 查找
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
      window.showToast('题库加载失败：暂无数据，请检查 data/questions.json', 'error');
    }
  }).catch(function(err) {
    window.showToast('题库加载失败：' + (err && err.message ? err.message : '未知错误'), 'error');
  });
})();
