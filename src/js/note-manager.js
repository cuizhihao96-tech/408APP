/* ===== 408 刷题助手 - 错题/收藏/笔记模块 ===== */
(function() {

  function toggleFav(qid) {
    if (window.favIds.has(qid)) {
      window.favIds.delete(qid);
    } else {
      window.favIds.add(qid);
    }
    window.saveFav();
  }

  function renderNoteList(type, filterSubject, filterChapter) {
    var ids = type === 'review' ? window.wrongIds : (type === 'learned' ? window.learnedIds : window.favIds);
    var cfg = {
      review: { ids: ids, filterId: 'review-filter', listId: 'review-list', emptyId: 'review-empty', showBatch: true,
        clearAction: function() { window.wrongIds.clear(); window.saveWrong(); renderNoteList(type, filterSubject, filterChapter); },
        redoAction: function(list) { window.quizList = window.shuffle(list); window.quizIndex = 0; window.reviewMode = true; window.switchView('quiz-view'); document.addEventListener('keydown', window.onQuizKeydown); window.renderQuizQuestion(); }
      },
      learned: { ids: ids, filterId: 'learned-filter', listId: 'learned-list', emptyId: 'learned-empty', showBatch: false },
      fav: { ids: ids, filterId: 'fav-filter', listId: 'fav-list', emptyId: 'fav-empty', showBatch: false }
    }[type];
    var chapters = filterSubject ? window.getChapters(filterSubject) : null;

    // 科目筛选
    var filter = document.getElementById(cfg.filterId);
    var filterHTML = '<button class="' + (!filterSubject ? 'active' : '') + '" data-s="">全部科目</button>';
    filterHTML += window.subjects.map(function(s) {
      return '<button class="' + (filterSubject === s.key ? 'active' : '') + '" data-s="' + s.key + '">' + s.name + '</button>';
    }).join('');
    filter.innerHTML = filterHTML;
    filter.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() { renderNoteList(type, btn.dataset.s || null, null); });
    });

    // 章节筛选
    var chapterFilterEl = document.getElementById(type === 'review' ? 'review-chapter-filter' : (type === 'learned' ? 'learned-chapter-filter' : 'fav-chapter-filter'));
    if (filterSubject && chapters && chapters.size > 1) {
      chapterFilterEl.style.display = 'flex';
      chapterFilterEl.innerHTML = '<button class="' + (!filterChapter ? 'active' : '') + '" data-ch="">全部章节</button>' +
        Array.from(chapters.keys()).map(function(ch) {
          return '<button class="' + (filterChapter === ch ? 'active' : '') + '" data-ch="' + window.escapeHtml(ch) + '">' + window.escapeHtml(ch.split(' ').pop()) + '</button>';
        }).join('');
      chapterFilterEl.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() { renderNoteList(type, filterSubject, btn.dataset.ch || null); });
      });
    } else {
      chapterFilterEl.style.display = 'none';
    }

    // 过滤题目
    var noteQuestions = [];
    cfg.ids.forEach(function(id) {
      var found = window.questionsById.get(id);
      if (found) noteQuestions.push(found);
    });
    if (filterSubject) noteQuestions = noteQuestions.filter(function(q) { return q.subject === filterSubject; });
    if (filterChapter) noteQuestions = noteQuestions.filter(function(q) { return q.chapter === filterChapter; });

    var list = document.getElementById(cfg.listId);
    var empty = document.getElementById(cfg.emptyId);

    if (noteQuestions.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'flex';
      var batchBar = document.getElementById(type === 'review' ? 'review-batch' : '');
      if (batchBar) batchBar.style.display = 'none';
      return;
    }
    empty.style.display = 'none';

    // 批量操作栏（仅错题本）
    if (cfg.showBatch) {
      var batchBarEl = document.getElementById('review-batch');
      batchBarEl.style.display = 'flex';
      batchBarEl.innerHTML = '<span>' + noteQuestions.length + ' 道错题</span>' +
        '<button class="btn-batch" id="btn-redo-all">重做全部</button>' +
        '<button class="btn-batch btn-batch-clear" id="btn-clear-wrong">清空错题本</button>';
      document.getElementById('btn-redo-all').onclick = function() { cfg.redoAction(noteQuestions); };
      document.getElementById('btn-clear-wrong').onclick = function() {
        window.showModal('清空错题本', '确定清空所有错题吗？', function() { cfg.clearAction(); });
      };
    }

    // 题目列表
    list.innerHTML = noteQuestions.map(function(q) {
      return '<div class="review-item" data-id="' + q.id + '">' +
        '<div class="ri-chapter">' + q.subject + ' \u00b7 ' + q.chapter + ' \u00b7 ' + (q.type === 'choice' ? '选择' : '大题') + '</div>' +
        '<div class="ri-question">' + window.escapeHtml(q.question) + '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.review-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var qid = item.dataset.id;
        var q = window.questionsById.get(qid);
        if (!q) return;
        window.quizList = [q]; window.quizIndex = 0; window.reviewMode = true;
        window.switchView('quiz-view');
        document.addEventListener('keydown', window.onQuizKeydown);
        window.renderQuizQuestion();
      });
    });
  }

  window.toggleFav = toggleFav;
  window.renderNoteList = renderNoteList;
  window.renderReview = function(filterSubject, filterChapter) { renderNoteList('review', filterSubject, filterChapter); };
  window.renderLearned = function(filterSubject, filterChapter) { renderNoteList('learned', filterSubject, filterChapter); };
  window.renderFav = function(filterSubject, filterChapter) { renderNoteList('fav', filterSubject, filterChapter); };
})();
