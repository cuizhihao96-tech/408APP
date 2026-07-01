/* ===== 408 刷题助手 - 统计与进度模块 ===== */
(function() {
  var wrongIds = window.wrongIds;
  var learnedIds = window.learnedIds;
  var favIds = window.favIds;
  var progress = window.progress;
  var dailyLog = window.dailyLog;

  function recordProgress(q) {
    var alreadyLearned = learnedIds.has(q.id);
    if (!alreadyLearned) {
      learnedIds.add(q.id);
      window.saveLearned();
      progress[q.subject] = (progress[q.subject] || 0) + 1;
      window.saveProgress();
      logToday();
    }
  }

  function logToday() {
    var today = new Date().toISOString().slice(0, 10);
    dailyLog[today] = (dailyLog[today] || 0) + 1;

    // 仅在日期切换时执行一次 90 天清理（之前每次答题都扫描）
    if (logToday._lastCleanDate !== today) {
      logToday._lastCleanDate = today;
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      var cutoffStr = cutoff.toISOString().slice(0, 10);
      var keys = Object.keys(dailyLog);
      var cleaned = false;
      keys.forEach(function(k) {
        if (k < cutoffStr) { delete dailyLog[k]; cleaned = true; }
      });
      if (cleaned) { window.saveDailyLog(); return; }
    }
    window.saveDailyLog();
  }

  function renderStats() {
    var body = document.getElementById('stats-body');
    var html = '';

    window.subjects.forEach(function(s) {
      var subQs = window.subjectQuestions.get(s.key) || [];
      var done = progress[s.key] || 0;
      var total = subQs.length;
      var pct = total ? Math.round(done / total * 100) : 0;

      var subWrong = [];
      wrongIds.forEach(function(id) {
        var q = window.questionsById.get(id);
        if (q && q.subject === s.key) subWrong.push(q);
      });
      var right = done - subWrong.length;
      var acc = done > 0 ? Math.round(right / done * 100) : 0;

      html += '<div class="stats-subject">' +
        '<div class="stats-subj-header">' +
          '<span class="stats-subj-name" style="color:' + s.color + '">' + s.icon + ' ' + s.name + '</span>' +
          '<span>' + done + '/' + total + ' 题 (' + pct + '%)</span>' +
        '</div>' +
        '<div class="stats-row">' +
          '<span>正确率 <strong>' + acc + '%</strong></span>' +
          '<span>错题 <strong style="color:var(--wrong)">' + subWrong.length + '</strong> 道</span>' +
        '</div>' +
        '<div class="bar" style="margin-top:8px"><div class="bar-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div>' +
      '</div>';

      var chapters = window.getChapters(s.key);
      if (chapters.size > 1) {
        html += '<div class="stats-chapters">';
        chapters.forEach(function(chQs, ch) {
          var chIds = new Set(chQs.map(function(q) { return q.id; }));
          var chLearned = 0, chWrong = 0;
          learnedIds.forEach(function(id) { if (chIds.has(id)) chLearned++; });
          wrongIds.forEach(function(id) { if (chIds.has(id)) chWrong++; });
          html += '<div class="stats-chapter-item">' +
            '<span class="stats-ch-name">' + window.escapeHtml(ch) + '</span>' +
            '<span>' + chLearned + '/' + chQs.length + ' 题</span>' +
            (chWrong > 0 ? '<span style="color:var(--wrong);margin-left:8px;">错' + chWrong + '</span>' : '') +
          '</div>';
        });
        html += '</div>';
      }
    });

    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    html += '<div class="stats-subject"><div class="stats-subj-header"><span>近7天刷题</span></div>';
    html += '<div class="stats-chart">';
    var maxC = 1;
    days.forEach(function(dd) { maxC = Math.max(maxC, dailyLog[dd] || 0); });
    days.forEach(function(d) {
      var c = dailyLog[d] || 0;
      var h = Math.round(c / maxC * 80);
      html += '<div class="chart-bar-wrapper">' +
        '<div class="chart-bar" style="height:' + h + 'px" title="' + d + ': ' + c + '题"></div>' +
        '<span class="chart-label">' + d.slice(5) + '</span>' +
      '</div>';
    });
    html += '</div></div>';

    body.innerHTML = html;
  }

  function makeExportData() {
    return {
      version: 3,
      exportDate: new Date().toISOString(),
      wrongIds: Array.from(wrongIds),
      learnedIds: Array.from(learnedIds),
      favIds: Array.from(favIds),
      progress: progress,
      dailyLog: dailyLog,
    };
  }

  function applyImportData(data) {
    window.wrongIds = new Set(data.wrongIds || []);
    window.learnedIds = new Set(data.learnedIds || []);
    window.favIds = new Set(data.favIds || []);
    window.progress = data.progress || {};
    window.dailyLog = data.dailyLog || {};
    wrongIds = window.wrongIds;
    learnedIds = window.learnedIds;
    favIds = window.favIds;
    progress = window.progress;
    dailyLog = window.dailyLog;
    window.saveWrong(); window.saveLearned(); window.saveFav(); window.saveProgress(); window.saveDailyLog();
    window.showToast('导入成功！');
    window.renderHome();
  }

  async function exportAllData() {
    var data = makeExportData();
    if (window.appAPI && window.appAPI.showSaveDialog) {
      var result = await window.appAPI.showSaveDialog({
        title: '导出学习数据',
        defaultPath: '408-backup-' + new Date().toISOString().slice(0,10) + '.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (result.canceled || !result.filePath) return;
      var ok = await window.appAPI.exportData(result.filePath, data);
      window.showToast(ok ? '导出成功！' : '导出失败', ok ? '' : 'error');
    } else {
      // Web 模式：浏览器下载
      var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '408-backup-' + new Date().toISOString().slice(0,10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.showToast('导出成功！');
    }
  }

  async function importAllData() {
    if (window.appAPI && window.appAPI.showOpenDialog) {
      var result = await window.appAPI.showOpenDialog({
        title: '导入学习数据',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      });
      if (result.canceled || !result.filePaths || !result.filePaths.length) return;
      var rawData = await window.appAPI.importData(result.filePaths[0]);
      if (!rawData) { window.showToast('导入失败：无法读取文件', 'error'); return; }
      if (!rawData.wrongIds && !rawData.learnedIds && !rawData.progress) {
        window.showToast('文件格式不正确', 'error');
        return;
      }
      window.showModal('导入数据',
        '将导入以下数据：\n- 错题 ' + (rawData.wrongIds || []).length + ' 道\n- 已学 ' + (rawData.learnedIds || []).length + ' 道\n- 进度 ' + Object.keys(rawData.progress || {}).length + ' 科\n\n这会覆盖当前数据，确定继续？',
        function() { applyImportData(rawData); }
      );
    } else {
      // Web 模式：浏览器文件选择
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var rawData = JSON.parse(e.target.result);
          } catch(ex) {
            window.showToast('文件格式错误', 'error');
            return;
          }
          if (!rawData.wrongIds && !rawData.learnedIds && !rawData.progress) {
            window.showToast('文件格式不正确', 'error');
            return;
          }
          window.showModal('导入数据',
            '将导入以下数据：\n- 错题 ' + (rawData.wrongIds || []).length + ' 道\n- 已学 ' + (rawData.learnedIds || []).length + ' 道\n- 进度 ' + Object.keys(rawData.progress || {}).length + ' 科\n\n这会覆盖当前数据，确定继续？',
            function() { applyImportData(rawData); }
          );
        };
        reader.readAsText(file);
      };
      input.click();
    }
  }

  window.recordProgress = recordProgress;
  window.renderStats = renderStats;
  window.exportAllData = exportAllData;
  window.importAllData = importAllData;
})();
