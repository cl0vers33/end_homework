/* ============================================
   首页逻辑：加载公告 + 排球场概览卡片
   ============================================ */
$(function () {

  /* ---------- 1. 加载公告栏 ---------- */
  loadJSON('data/announcements.json', function (data) {
    var list = data.announcements || [];
    var $box = $('#announcement-list');
    $box.empty();

    // 数据为空数组时的提示
    if (list.length === 0) {
      $box.html('<div class="empty-tip">暂无公告</div>');
      return;
    }

    // 徽章颜色：按公告级别映射
    var levelCls = { '重要': 'bg-danger', '警示': 'bg-warning text-dark', '通知': 'bg-secondary' };

    $.each(list, function (i, item) {
      var cls = levelCls[item.level] || 'bg-secondary';
      var html =
        '<div class="announcement-item">' +
        '  <div class="d-flex flex-wrap align-items-center gap-2">' +
        '    <span class="badge ' + cls + '">' + item.level + '</span>' +
        '    <strong>' + item.title + '</strong>' +
        '    <small class="text-muted ms-auto">' + item.date + '</small>' +
        '  </div>' +
        '  <p class="mb-0 mt-1 text-muted small">' + item.content + '</p>' +
        '</div>';
      $box.append(html);
    });
  }, function (msg) {
    showError('#index-error', msg);
    $('#announcement-list').html('<div class="empty-tip">公告加载失败</div>');
  });

  /* ---------- 2. 加载排球场概览卡片 ---------- */
  loadJSON('data/courts.json', function (data) {
    var courts = data.courts || [];
    var $wrap = $('#overview-cards');
    $wrap.empty();

    if (courts.length === 0) {
      $wrap.html('<div class="col-12"><div class="empty-tip">场地数据为空</div></div>');
      return;
    }

    $('#update-time').text(data.updateTime || '未知');

    // 只挑选"当前开放且有空场"的场地，按空闲率从高到低，最多展示 6 个
    var openCourts = $.grep(courts, function (c) {
      return isOpenNow(c.openTime, c.closeTime) && c.free > 0;
    });
    openCourts.sort(function (a, b) {
      return (b.free / b.count) - (a.free / a.count);
    });
    var top = openCourts.slice(0, 6);

    if (top.length === 0) {
      $wrap.html('<div class="col-12"><div class="empty-tip">当前没有开放中的空场（可能已过开放时间）</div></div>');
      return;
    }

    $.each(top, function (i, c) {
      var st = courtStatus(c.free, c.count);
      var html =
        '<div class="col-12 col-md-6 col-lg-4">' +
        '  <div class="card h-100"><div class="card-body">' +
        '    <div class="d-flex justify-content-between align-items-start">' +
        '      <h3 class="h6 mb-1">' + c.name + '</h3>' +
        '      <span class="badge ' + st.cls + '">' + st.text + '</span>' +
        '    </div>' +
        '    <p class="text-muted small mb-2">' + c.campus + ' · ' + c.type + ' · ' + c.surface + '</p>' +
        '    <p class="mb-2">空闲 <strong class="text-success">' + c.free + '</strong> / ' + c.count + ' 片</p>' +
        '    <div class="progress mb-2" style="height:6px;">' +
        '      <div class="progress-bar bg-success" style="width:' + Math.round(c.free / c.count * 100) + '%"></div>' +
        '    </div>' +
        '    <small class="text-muted">🕐 ' + c.openTime + ' - ' + c.closeTime +
        '      ｜💡 ' + (c.lights ? '有夜灯' : '无夜灯') + '</small>' +
        '  </div></div>' +
        '</div>';
      $wrap.append(html);
    });
  }, function (msg) {
    showError('#index-error', msg);
    $('#overview-cards').html('<div class="col-12"><div class="empty-tip">场地数据加载失败</div></div>');
  });

});
