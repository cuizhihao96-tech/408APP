/* ===== 408 刷题助手 - UI 渲染模块 ===== */
(function() {

  // ========== 首页 ==========
  function renderHome() {
    var grid = document.getElementById('subject-grid');
    grid.innerHTML = window.subjects.map(function(s) {
      var pd = window.getSubjectProgress(s.key);
      var done = pd.done, total = pd.total;
      var pct = total ? Math.round(done / total * 100) : 0;
      var chCount = window.getChapters(s.key).size;
      return '<div class="subject-card" data-subject="' + s.key + '">' +
        '<div class="icon" style="background:' + s.color + '20">' + s.icon + '</div>' +
        '<div class="name">' + s.name + '</div>' +
        '<div class="progress">' + done + ' / ' + total + ' 题 \u00b7 ' + chCount + '个章节</div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div>' +
      '</div>';
    }).join('');

    var totalDone = Object.values(window.progress).reduce(function(a, b) { return a + b; }, 0);
    var totalAll = window.questions.length;
    var wrongCount = window.wrongIds.size;
    var rightCount = Math.max(0, totalDone - wrongCount);
    var accuracy = totalDone > 0 ? Math.round(rightCount / totalDone * 100) : 0;

    document.getElementById('home-stats').innerHTML =
      '<span>已刷 <strong>' + totalDone + '</strong> 题</span>' +
      '<span>正确率 <strong>' + accuracy + '%</strong></span>' +
      '<span>总题量 <strong>' + totalAll + '</strong> 题</span>' +
      '<span>错题 <strong>' + wrongCount + '</strong> 道</span>';

    var today = new Date().toISOString().slice(0, 10);
    var todayCount = window.dailyLog[today] || 0;
    document.getElementById('today-stats').textContent = '今日已刷 ' + todayCount + ' 题';

    grid.querySelectorAll('.subject-card').forEach(function(card) {
      card.addEventListener('click', function() {
        window.currentSubject = card.dataset.subject;
        window.currentChapter = null;
        renderChapterSelect();
      });
    });

    document.querySelectorAll('.mode-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.mode === window.mode);
      btn.onclick = function() {
        window.mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.mode === window.mode); });
      };
    });

    document.getElementById('btn-random').onclick = function() { startQuiz(true); };
    document.getElementById('btn-review').onclick = function() { window.renderReview(); window.switchView('review-view'); };
    document.getElementById('btn-learned').onclick = function() { window.renderLearned(); window.switchView('learned-view'); };
    document.getElementById('btn-fav').onclick = function() { window.renderFav(); window.switchView('fav-view'); };
    document.getElementById('btn-stats').onclick = function() { window.renderStats(); window.switchView('stats-view'); };
    document.getElementById('btn-export').onclick = window.exportAllData;
    document.getElementById('btn-import').onclick = window.importAllData;

    var pinBtn = document.getElementById('btn-pin');
    if (window.appAPI && window.appAPI.setAlwaysOnTop) {
      pinBtn.textContent = window.isPinned ? '取消置顶' : '置顶';
      pinBtn.onclick = function() {
        window.isPinned = !window.isPinned;
        window.appAPI.setAlwaysOnTop(window.isPinned);
        pinBtn.textContent = window.isPinned ? '取消置顶' : '置顶';
      };
    } else {
      // Web 模式：置顶不适用，隐藏按钮
      pinBtn.style.display = 'none';
    }
  }

  // ========== 章节选择 ==========
  function renderChapterSelect() {
    var chapters = window.getChapters(window.currentSubject);
    var chapterNames = Array.from(chapters.keys());
    var container = document.getElementById('chapter-select');
    var grid = document.getElementById('subject-grid');
    grid.style.display = 'none';

    var totalQ = 0;
    chapters.forEach(function(v) { totalQ += v.length; });
    container.innerHTML =
      '<div class="chapter-header">' +
        '<button class="btn-back" id="btn-chapter-back">\u2190 返回</button>' +
        '<span class="chapter-title">' + window.currentSubject + ' \u00b7 选择章节</span>' +
        '<span class="chapter-total">' + chapterNames.length + '个章节 / ' + totalQ + '题</span>' +
      '</div>' +
      '<button class="chapter-item" data-chapter=""><span>全部章节</span><span class="chapter-count">' + totalQ + '题</span></button>' +
      chapterNames.map(function(ch) {
        var cnt = chapters.get(ch).length;
        return '<button class="chapter-item" data-chapter="' + window.escapeHtml(ch) + '"><span>' + window.escapeHtml(ch) + '</span><span class="chapter-count">' + cnt + '题</span></button>';
      }).join('');

    container.style.display = 'flex';
    document.getElementById('home-actions').style.display = 'none';
    document.getElementById('home-stats').style.display = 'none';

    document.getElementById('btn-chapter-back').onclick = function() {
      container.style.display = 'none';
      grid.style.display = '';
      document.getElementById('home-actions').style.display = '';
      document.getElementById('home-stats').style.display = '';
      window.currentSubject = null;
    };

    container.querySelectorAll('.chapter-item').forEach(function(item) {
      item.addEventListener('click', function() {
        window.currentChapter = item.dataset.chapter || null;
        startQuiz(true);
      });
    });
  }

  // ========== 刷题 ==========
  function startQuiz(shuffleMode) {
    window.quizList = window.getFilteredQuestions(window.currentSubject, window.currentChapter);
    if (window.quizList.length === 0) {
      window.showToast('当前筛选条件下没有题目', 'warn');
      return;
    }
    window.reviewMode = false;
    if (shuffleMode) window.quizList = window.shuffle(window.quizList);
    window.quizIndex = 0;
    window.switchView('quiz-view');
    document.addEventListener('keydown', window.onQuizKeydown);
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = window.quizList[window.quizIndex];
    document.getElementById('quiz-meta').textContent = q.subject + ' \u00b7 ' + q.chapter;
    document.getElementById('quiz-progress').textContent = (window.quizIndex + 1) + ' / ' + window.quizList.length;

    var favBtn = document.getElementById('btn-fav-toggle');
    favBtn.textContent = window.favIds.has(q.id) ? '\u2605' : '\u2606';
    favBtn.className = window.favIds.has(q.id) ? 'btn-fav active' : 'btn-fav';
    favBtn.onclick = function() {
      window.toggleFav(q.id);
      favBtn.textContent = window.favIds.has(q.id) ? '\u2605' : '\u2606';
      favBtn.className = window.favIds.has(q.id) ? 'btn-fav active' : 'btn-fav';
    };

    var body = document.getElementById('quiz-body');

    if (q.type === 'choice') {
      var labels = ['A', 'B', 'C', 'D'];
      body.innerHTML =
        '<div class="quiz-question">' + window.escapeHtml(q.question) + '</div>' +
        '<div class="quiz-options">' +
          q.options.map(function(opt, i) {
            return '<div class="quiz-option" data-idx="' + i + '"><span class="opt-label">' + labels[i] + '</span><span>' + window.escapeHtml(opt) + '</span></div>';
          }).join('') +
        '</div>' +
        '<div class="quiz-explanation"><div class="exp-label">解析</div><div>' + window.escapeHtml(q.explanation || '暂无解析') + '</div></div>';

      var answered = false;
      body.querySelectorAll('.quiz-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
          if (answered) return;
          answered = true;
          handleChoiceAnswer(parseInt(opt.dataset.idx), q, body);
        });
      });
    } else {
      body.innerHTML =
        '<div class="quiz-question">' + window.escapeHtml(q.question) + '</div>' +
        '<button class="btn-show-answer" id="btn-show">显示答案</button>' +
        '<div class="quiz-big-answer">' + window.escapeHtml(q.answer || '暂无参考答案') + '</div>' +
        '<div class="quiz-self-check">' +
          '<button class="btn-self got" id="btn-got">\u2714 我对了</button>' +
          '<button class="btn-self miss" id="btn-miss">\u2718 我错了</button>' +
        '</div>';

      document.getElementById('btn-show').addEventListener('click', function() {
        this.style.display = 'none';
        body.querySelector('.quiz-big-answer').classList.add('show');
        body.querySelector('.quiz-self-check').classList.add('show');
      });

      var bigAnswered = false;
      document.getElementById('btn-got').addEventListener('click', function() {
        if (bigAnswered) return; bigAnswered = true;
        window.recordProgress(q);
        showNextButton(body);
      });
      document.getElementById('btn-miss').addEventListener('click', function() {
        if (bigAnswered) return; bigAnswered = true;
        window.wrongIds.add(q.id); window.saveWrong();
        window.recordProgress(q);
        showNextButton(body);
      });
    }
  }

  function handleChoiceAnswer(idx, q, body) {
    var allOpts = body.querySelectorAll('.quiz-option');
    allOpts.forEach(function(o) { o.classList.add('disabled'); });

    allOpts.forEach(function(o) {
      if (parseInt(o.dataset.idx) === q.answer) o.classList.add('correct');
    });

    if (idx !== q.answer) {
      body.querySelector('.quiz-option[data-idx="' + idx + '"]').classList.add('wrong');
      window.wrongIds.add(q.id); window.saveWrong();
    } else {
      if (window.reviewMode) { window.wrongIds.delete(q.id); window.saveWrong(); }
    }
    window.recordProgress(q);

    allOpts.forEach(function(o) {
      var oi = parseInt(o.dataset.idx);
      if (oi !== q.answer && oi !== idx) o.classList.add('dim');
    });
    body.querySelector('.quiz-explanation').classList.add('show');
    showNextButton(body);
  }

  function showNextButton(body) {
    if (window.quizIndex < window.quizList.length - 1) {
      var btnNext = document.createElement('button');
      btnNext.className = 'btn-next';
      btnNext.textContent = '下一题 → (Enter)';
      btnNext.addEventListener('click', function() { window.quizIndex++; renderQuizQuestion(); });
      body.appendChild(btnNext);
    } else {
      var done = document.createElement('div');
      done.className = 'quiz-done';
      done.textContent = '本组题目已完成';
      body.appendChild(done);
    }
  }

  window.renderHome = renderHome;
  window.renderQuizQuestion = renderQuizQuestion;
})();
