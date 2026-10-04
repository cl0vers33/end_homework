/* ============================================
   数据统计页逻辑：ECharts 柱状图 + 折线图 + 饼图
   ============================================ */
$(function () {

  // 三个图表实例（初始化后延迟到数据加载完成再 setOption）
  var chartBar = echarts.init(document.getElementById('chart-bar'));
  var chartLine = echarts.init(document.getElementById('chart-line'));
  var chartPie = echarts.init(document.getElementById('chart-pie'));

  // 统一配色（与站点主题一致）
  var colors = ['#6b4f3a', '#956134', '#c9a227', '#2a9d8f', '#e76f51', '#264653', '#8ab17d'];

  /* ---------- 窗口尺寸变化时图表自适应（响应式） ---------- */
  $(window).on('resize', function () {
    chartBar.resize();
    chartLine.resize();
    chartPie.resize();
  });

  /* ---------- 读取统计数据 ---------- */
  loadJSON('data/stats.json', function (data) {

    /* ===== 图表1：柱状图 - 各区域场地片数 ===== */
    var areaData = data.courtsByArea || [];
    if (areaData.length === 0) {
      showError('#stats-error', 'stats.json 中 courtsByArea 数据为空，无法绘制柱状图');
    } else {
      chartBar.setOption({
        color: colors,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 50, right: 20, bottom: 60, top: 30 },
        xAxis: {
          type: 'category',
          data: areaData.map(function (d) { return d.area; }),
          axisLabel: { rotate: 40, interval: 0, fontSize: 11 }
        },
        yAxis: { type: 'value', name: '场地片数' },
        series: [{
          name: '场地片数',
          type: 'bar',
          barMaxWidth: 36,
          data: areaData.map(function (d) { return d.count; }),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top' }
        }]
      });
    }

    /* ===== 图表2：折线图 - 近7日入场人次 ===== */
    var visitData = data.weeklyVisitors || [];
    if (visitData.length === 0) {
      showError('#stats-error', 'stats.json 中 weeklyVisitors 数据为空，无法绘制折线图');
    } else {
      chartLine.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 60, right: 30, bottom: 40, top: 40 },
        xAxis: { type: 'category', data: visitData.map(function (d) { return d.day; }) },
        yAxis: { type: 'value', name: '入场人次' },
        series: [{
          name: '入场人次',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          data: visitData.map(function (d) { return d.visitors; }),
          lineStyle: { width: 3, color: '#c9a227' },
          itemStyle: { color: '#c9a227' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(201,162,39,0.35)' },
                { offset: 1, color: 'rgba(201,162,39,0.02)' }
              ]
            }
          }
        }]
      });
    }

    /* ===== 图表3：饼图 - 时段使用占比 ===== */
    var periodData = data.usageByPeriod || [];
    if (periodData.length === 0) {
      showError('#stats-error', 'stats.json 中 usageByPeriod 数据为空，无法绘制饼图');
    } else {
      chartPie.setOption({
        color: colors,
        tooltip: {
          trigger: 'item',
          formatter: '{b}<br/>人次：{c}（{d}%）'
        },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          name: '时段使用占比',
          type: 'pie',
          radius: ['35%', '62%'],       // 环形饼图
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%' },
          data: periodData.map(function (d) {
            return { name: d.period, value: d.count };
          })
        }]
      });
    }

  }, function (msg) {
    // 数据加载失败时同时给出提示与空图占位
    showError('#stats-error', msg);
    ['chart-bar', 'chart-line', 'chart-pie'].forEach(function (id) {
      echarts.init(document.getElementById(id)).setOption({
        title: {
          text: '数据加载失败',
          subtext: '请检查 HTTP 服务器与 data/stats.json',
          left: 'center', top: 'center',
          textStyle: { color: '#999', fontSize: 14, fontWeight: 'normal' }
        }
      });
    });
  });

});
