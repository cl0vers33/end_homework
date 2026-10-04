# 云大排球场信息中心

云南大学信息学院《软件开发综合实践》期末大作业 —— 校园公共信息与数据展示中心。

围绕**校园排球场**这一公共体育服务，开发的一个纯前端响应式应用：
帮助同学快速了解全校排球场哪里有空场、几点开放、哪里有夜灯，并通过图表与三维场景认识球场。

## 功能清单

| 页面 | 文件 | 功能 |
|------|------|------|
| 首页 | `index.html` | 最新公告、今日有空场的球场概览卡片 |
| 场地查询 | `courts.html` | 关键词搜索 + 校区/类型/开放状态筛选 + 排序（交互查询模块） |
| 数据统计 | `stats.html` | ECharts 柱状图、折线图、饼图三类图表 |
| 三维导览 | `3d.html` | Three.js 标准排球场三维场景：旋转/缩放/平移、昼夜切换、点击场地显示规则 |

## 技术栈（均为课堂讲授内容）

- HTML5 / CSS3 / JavaScript
- jQuery 3.7（DOM 操作与 AJAX 加载 JSON）
- Bootstrap 5.3（响应式布局与组件）
- ECharts 5.5（数据可视化）
- Three.js r128（三维展示）

所有依赖库已下载到 `libs/` 目录，**无需联网即可运行**。

## 运行步骤（从克隆到运行）

由于浏览器禁止 `file://` 协议下读取本地 JSON，请通过 HTTP 服务器访问：

```bash
# 1. 克隆仓库
git clone https://github.com/<你的用户名>/yunnu-volleyball-info-center.git
cd yunnu-volleyball-info-center

# 2. 启动本地 HTTP 服务器（任选一种，Python 3 自带）
python -m http.server 8000

# 3. 浏览器访问
http://localhost:8000
```

> 没有安装 Python 时也可使用 VS Code 的 Live Server 插件，或
> `npx http-server`（需要 Node.js）。

手机测试：电脑与手机连接同一 Wi-Fi，用 `ipconfig` 查询电脑局域网 IP，
手机访问 `http://<电脑IP>:8000` 即可体验响应式布局。

## 数据说明

`data/` 目录下的三个 JSON 文件均为课程演示用模拟数据：

- `courts.json`：12 片场地（名称、校区、类型、地面材质、片数、空闲数、开放时间、夜灯、标签）
- `stats.json`：柱状图（各区域场地片数）、折线图（近7日入场人次）、饼图（时段使用占比）
- `announcements.json`：4 条场地公告

柱状图中“各区域场地片数”与 `courts.json` 中各场地 `count` 字段汇总一致，可相互核验。

## 错误处理

- **网络/文件加载失败**：页面顶部红色 Alert 显示具体错误码与文件路径
- **直接双击打开 HTML（file:// 协议）**：自动检测并提示改用 HTTP 服务器访问
- **查询无结果**：显示“没有符合条件的排球场”空状态提示
- **非法输入**：搜索关键词只允许中文/字母/数字，违规时表单标红提示

## 目录结构

```
yunnu-volleyball-info-center/
├── index.html          # 首页
├── courts.html         # 场地查询页
├── stats.html          # 数据统计页
├── 3d.html             # 三维导览页
├── css/style.css       # 公共样式
├── js/
│   ├── common.js       # 公共函数（JSON加载/错误提示/状态计算）
│   ├── index.js        # 首页逻辑
│   ├── courts.js       # 查询页逻辑
│   ├── stats.js        # 图表逻辑
│   └── scene3d.js      # Three.js 场景逻辑
├── data/               # 三个本地 JSON 数据文件
└── libs/               # 本地化的第三方库（离线可运行）
```
