/* ===== 408 刷题助手 - 题库管理模块 ===== */
(function() {

  var chaptersCache = {};

  function getChapters(subject) {
    if (chaptersCache[subject]) return chaptersCache[subject];
    var chapters = new Map();
    window.questions.filter(function(q) { return q.subject === subject; }).forEach(function(q) {
      if (!chapters.has(q.chapter)) chapters.set(q.chapter, []);
      chapters.get(q.chapter).push(q);
    });
    var sorted = new Map();
    Array.from(chapters.keys()).sort(function(a, b) {
      var numA = a.match(/^(\d+(?:\.\d+)*)/);
      var numB = b.match(/^(\d+(?:\.\d+)*)/);
      if (numA && numB) {
        var partsA = numA[1].split('.').map(Number);
        var partsB = numB[1].split('.').map(Number);
        for (var i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          var va = partsA[i] || 0;
          var vb = partsB[i] || 0;
          if (va !== vb) return va - vb;
        }
        return 0;
      }
      return a.localeCompare(b);
    }).forEach(function(k) { sorted.set(k, chapters.get(k)); });
    chaptersCache[subject] = sorted;
    return sorted;
  }

  function getFilteredQuestions(subject, chapter) {
    var list = subject ? (window.subjectQuestions.get(subject) || []).slice() : window.questions.slice();
    if (chapter) list = list.filter(function(q) { return q.chapter === chapter; });
    if (window.mode === 'choice') list = list.filter(function(q) { return q.type === 'choice'; });
    if (window.mode === 'big') list = list.filter(function(q) { return q.type === 'big'; });
    return list;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  window.getChapters = getChapters;
  window.getFilteredQuestions = getFilteredQuestions;
  window.shuffle = shuffle;
})();
