/* ============================================
   场地查询页逻辑：搜索 + 筛选 + 排序 + 错误处理
   ============================================ */
$(function () {

  var allCourts = [];   // 缓存从 JSON 读取的全部场地数据

  /* ---------- 1. 页面加载时读取数据 ---------- */
  loadJSON('data/courts.json', function (data) {
    allCourts = data.courts || [];
    render(allCourts);            // 首次进入展示全部
  }, function (msg) {
    showError('#courts-error', msg);
    $('#empty-tip').show().find('.h5').text('数据加载失败，请检查运行环境后刷新页面');
  });

  /* ---------- 2. 表单提交：执行查询 ---------- */
  $('#query-form').on('submit', function (e) {
    e.preventDefault();          // 阻止表单默认刷新页面

    var kw = $('#kw').val().trim();

    // 非法输入校验：只允许中文、字母、数字、空格
    var kwPattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s]*$/;
    if (!kwPattern.test(kw)) {
      $('#kw').addClass('is-invalid');
      return;
    }
    $('#kw').removeClass('is-invalid');

    var campus = $('#campus').val();
    var type = $('#type').val();
    var openOnly = $('#opennow').val() === 'yes';
    var sortKey = $('#sort').val();

    // 第一步：关键词过滤（匹配名称、类型、地面、标签、简介）
    var result = $.grep(allCourts, function (c) {
      if (!kw) return true;
      var hay = c.name + c.type + c.surface + c.tags.join('') + c.intro;
      return hay.indexOf(kw) !== -1;
    });

    // 第二步：校区过滤
    result = $.grep(result, function (c) {
      return !campus || c.campus === campus;
    });

    // 第三步：场地类型过滤
    result = $.grep(result, function (c) {
      return !type || c.type === type;
    });

    // 第四步：开放状态过滤
    if (openOnly) {
      result = $.grep(result, function (c) {
        return isOpenNow(c.openTime, c.closeTime);
      });
    }

    // 第五步：排序
    result.sort(function (a, b) {
      if (sortKey === 'count') return b.count - a.count;
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'zh-CN');
      return b.free - a.free;   // 默认按空闲片数从多到少
    });

    render(result);
  });

  /* ---------- 3. 重置按钮：恢复初始状态 ---------- */
  $('#reset-btn').on('click', function () {
    $('#kw').removeClass('is-invalid');
    render(allCourts);
  });

  /* ---------- 4. 渲染结果列表 ---------- */
  function render(list) {
    var $wrap = $('#court-list');
    $wrap.empty();
    $('#result-count').text(list.length);

    // 查询结果为空的友好提示（错误处理之一）
    if (list.length === 0) {
      $('#empty-tip').show();
      return;
    }
    $('#empty-tip').hide();

    $.each(list, function (i, c) {
      var st = courtStatus(c.free, c.count);
      var openFlag = isOpenNow(c.openTime, c.closeTime);

      // 标签渲染
      var tagHtml = '';
      $.each(c.tags, function (j, t) {
        tagHtml += '<span class="badge bg-light text-dark border me-1">' + t + '</span>';
      });

      var html =
        '<div class="col-12 col-md-6 col-lg-4">' +
        '  <div class="card h-100"><div class="card-body">' +
        '    <div class="d-flex justify-content-between align-items-start">' +
        '      <h3 class="h6 mb-1">' + c.name + '</h3>' +
        '      <span class="badge ' + st.cls + '">' + st.text + '</span>' +
        '    </div>' +
        '    <p class="text-muted small mb-2">' + c.campus + ' · ' + c.type + ' · ' + c.surface + '</p>' +
        '    <p class="small mb-2">' + c.intro + '</p>' +
        '    <p class="mb-2 small">🏐 空闲 <strong class="' + (c.free > 0 ? 'text-success' : 'text-danger') + '">' +
                                   c.free + '</strong> / ' + c.count + ' 片' +
        '      ｜💡 ' + (c.lights ? '有夜灯' : '无夜灯') +
        '      ｜💰 ' + c.fee + '</p>' +
        '    <p class="mb-2 small">🕐 ' + c.openTime + ' - ' + c.closeTime +
        '      <span class="badge ' + (openFlag ? 'bg-success' : 'bg-secondary') + '">' +
        '        ' + (openFlag ? '开放中' : '未开放') + '</span></p>' +
        '    <div>' + tagHtml + '</div>' +
        '  </div></div>' +
        '</div>';
      $wrap.append(html);
    });
  }

  /* ---------- 5. 关键词输入时实时清除错误状态 ---------- */
  $('#kw').on('input', function () {
    $(this).removeClass('is-invalid');
  });

});
