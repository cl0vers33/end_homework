/* ============================================
   云大排球场信息中心 - 公共脚本
   依赖：jQuery 3.7
   ============================================ */

/**
 * 读取本地 JSON 文件的公共方法（基于 jQuery $.ajax）
 * @param {string} url    JSON 文件路径
 * @param {function} onSuccess  加载成功回调（参数为解析后的 JS 对象）
 * @param {function} onError    加载失败回调（参数为错误信息字符串）
 */
function loadJSON(url, onSuccess, onError) {
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    cache: false
  })
    .done(function (data) {
      // 数据为空的处理：空对象、空数组都视为空数据
      if (data === null || data === undefined || $.isEmptyObject(data)) {
        onError('数据文件内容为空：' + url);
        return;
      }
      onSuccess(data);
    })
    .fail(function (xhr, textStatus) {
      // 网络失败 / 文件不存在 / JSON 解析失败 的处理
      var msg;
      if (location.protocol === 'file:') {
        msg = '当前通过 file:// 协议打开页面，浏览器禁止读取本地 JSON。请使用 HTTP 服务器访问（详见运行说明）。';
      } else if (textStatus === 'parsererror') {
        msg = 'JSON 数据解析失败，文件格式可能已损坏：' + url;
      } else {
        msg = '数据加载失败（' + xhr.status + ' ' + textStatus + '）：' + url;
      }
      onError(msg);
    });
}

/**
 * 在指定容器显示错误提示框（Bootstrap Alert）
 */
function showError(selector, message) {
  $(selector).text(message).removeClass('d-none').addClass('show');
}

/**
 * 隐藏错误提示框
 */
function hideError(selector) {
  $(selector).removeClass('show').addClass('d-none');
}

/**
 * 根据空闲片数计算场地状态徽章
 * @param {number} free 空闲片数
 * @param {number} count 总片数
 * @returns {{text: string, cls: string}}
 */
function courtStatus(free, count) {
  if (free <= 0) return { text: '已满场', cls: 'badge-full' };
  var ratio = free / count;
  if (ratio <= 0.34) return { text: '较紧张', cls: 'badge-crowded' };
  return { text: '有空场', cls: 'badge-open' };
}

/**
 * 判断球场当前是否在开放时间段内
 * @param {string} openTime  形如 "07:00" 或 "全天开放"
 * @param {string} closeTime 形如 "22:30" 或 "全天开放"
 * @returns {boolean}
 */
function isOpenNow(openTime, closeTime) {
  // 全天开放的特殊处理
  if (openTime === '全天开放' || closeTime === '全天开放') return true;
  var now = new Date();
  var cur = now.getHours() * 60 + now.getMinutes();
  var open = toMinutes(openTime);
  var close = toMinutes(closeTime);
  if (close <= open) return true;   // 跨天视为常开
  return cur >= open && cur <= close;
}

/** "07:30" -> 450 */
function toMinutes(hhmm) {
  var parts = hhmm.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}
