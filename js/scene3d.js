/* ============================================
   三维导览页逻辑：Three.js 标准排球场场景
   场地尺寸按真实比例建模（1 单位 = 1 米）
   ============================================ */

// ---------- 1. 基础常量：标准排球场尺寸 ----------
var COURT_L = 18;        // 场地长度（x 方向）
var COURT_W = 9;         // 场地宽度（z 方向）
var NET_H = 2.43;        // 球网高度（男子网）
var ATTACK_D = 3;        // 前场区深度（距中线）

var scene, camera, renderer, controls, clock;
var ambientLight, sunLight;          // 灯光：环境光 + 太阳平行光
var lampLights = [], lampBulbs = []; // 灯柱点光源 + 灯泡网格
var clickable = [];                  // 可点击（射线拾取）的物体集合
var ball;                            // 排球（做上下浮动动画）
var isNight = false;

// 场地区域说明（点击拾取后显示在信息面板）
var zoneInfo = {
  leftCourt:  { name: 'A区（左侧半场）', desc: '长9米×宽9米半场，红色区域为前场区（3米线以内），前排队员在此完成扣球与拦网。' },
  rightCourt: { name: 'B区（右侧半场）', desc: '与A区对称的另一半场。发球从B区后端线外发出，飞越球网落入对方半场算得分。' },
  net:        { name: '球网（高2.43米）', desc: '男子网高2.43米、女子网高2.24米。网宽9.5米、高1米，网顶白色标志带垂直于边线。' },
  ball:       { name: '排球', desc: '圆周65-67cm、重量260-280g。一队最多触球3次（拦网除外）必须将球击回对方半场。' }
};

init();
animate();

/* ---------- 2. 场景初始化 ---------- */
function init() {
  var container = document.getElementById('scene-container');

  // 场景与雾效
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd7ea);   // 白天天空色
  scene.fog = new THREE.Fog(0xbfd7ea, 45, 90);

  // 相机：透视投影
  camera = new THREE.PerspectiveCamera(
    50, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(14, 10, 14);                // 默认斜 45° 视角

  // 渲染器：开启抗锯齿与阴影
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 轨道控制器：旋转 / 缩放 / 平移
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;                  // 阻尼，让转动有惯性更顺滑
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;    // 禁止钻到地面以下
  controls.minDistance = 6;
  controls.maxDistance = 45;
  controls.target.set(0, 1, 0);

  // 时钟：驱动排球动画
  clock = new THREE.Clock();

  buildLights();
  buildGround();
  buildCourt();
  buildNet();
  buildBall();
  buildLampPoles();
  buildStands();

  // 窗口尺寸变化时保持画面比例（响应式）
  window.addEventListener('resize', onResize);

  // 点击拾取：显示区域信息
  container.addEventListener('pointerdown', onPointerDown);

  // jQuery 绑定按钮与面板关闭
  $('#btn-day').on('click', function () { setDayNight(false); });
  $('#btn-night').on('click', function () { setDayNight(true); });
  $('#btn-top').on('click', moveTopView);
  $('#btn-net').on('click', moveNetView);
  $('#btn-reset').on('click', resetView);
  $('#panel-close').on('click', function () { $('#court-info-panel').hide(); });
}

/* ---------- 3. 灯光 ---------- */
function buildLights() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  // 太阳：平行光 + 阴影相机范围覆盖整个球场
  sunLight = new THREE.DirectionalLight(0xfff2d9, 1.0);
  sunLight.position.set(18, 26, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -25;
  sunLight.shadow.camera.right = 25;
  sunLight.shadow.camera.top = 25;
  sunLight.shadow.camera.bottom = -25;
  scene.add(sunLight);
}

/* ---------- 4. 地面 ---------- */
function buildGround() {
  // 大草坪（浅绿）
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 70),
    new THREE.MeshLambertMaterial({ color: 0x7fae6a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // 场外缓冲区（蓝色塑胶自由区）
  var apron = new THREE.Mesh(
    new THREE.BoxGeometry(COURT_L + 10, 0.1, COURT_W + 8),
    new THREE.MeshLambertMaterial({ color: 0x4a7fb5 })
  );
  apron.position.y = 0.05;
  apron.receiveShadow = true;
  scene.add(apron);
}

/* ---------- 5. 场地与边线 ---------- */
function buildCourt() {
  // 场地本体：两片半场（左右各 9×9），作为可点击区域
  var halfGeo = new THREE.BoxGeometry(COURT_L / 2, 0.06, COURT_W);
  var leftMat = new THREE.MeshLambertMaterial({ color: 0xe8a54b });  // A区橘色
  var rightMat = new THREE.MeshLambertMaterial({ color: 0xdd9a3f }); // B区稍深

  var left = new THREE.Mesh(halfGeo, leftMat);
  left.position.set(-COURT_L / 4, 0.13, 0);
  left.userData.zone = 'leftCourt';
  left.receiveShadow = true;
  scene.add(left);
  clickable.push(left);

  var right = new THREE.Mesh(halfGeo, rightMat);
  right.position.set(COURT_L / 4, 0.13, 0);
  right.userData.zone = 'rightCourt';
  right.receiveShadow = true;
  scene.add(right);
  clickable.push(right);

  // 白色边线：厚度 0.05 的细长条
  var lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var lineH = 0.05, lineY = 0.17;

  function addLine(w, d, x, z) {
    var line = new THREE.Mesh(new THREE.BoxGeometry(w, lineH, d), lineMat);
    line.position.set(x, lineY, z);
    scene.add(line);
  }
  addLine(COURT_L + 0.1, 0.1, 0,  COURT_W / 2);   // 上边线
  addLine(COURT_L + 0.1, 0.1, 0, -COURT_W / 2);   // 下边线
  addLine(0.1, COURT_W, -COURT_L / 2, 0);          // 左端线
  addLine(0.1, COURT_W,  COURT_L / 2, 0);          // 右端线
  addLine(0.08, COURT_W, 0, 0);                    // 中线
  addLine(0.08, COURT_W, -ATTACK_D, 0);            // A区3米线
  addLine(0.08, COURT_W,  ATTACK_D, 0);            // B区3米线
}

/* ---------- 6. 球网与网柱 ---------- */
function buildNet() {
  var group = new THREE.Group();

  // 网柱：两根灰色圆柱，立在边线外 0.6 米
  var postGeo = new THREE.CylinderGeometry(0.06, 0.06, NET_H + 0.25, 12);
  var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  [-1, 1].forEach(function (side) {
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, (NET_H + 0.25) / 2 + 0.1, side * (COURT_W / 2 + 0.6));
    post.castShadow = true;
    group.add(post);
  });

  // 网面：半透明白色平面（1 米高）
  var netPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_W + 1.2, 1),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide
    })
  );
  netPlane.position.set(0, NET_H - 0.5 + 0.1, 0);
  netPlane.userData.zone = 'net';
  group.add(netPlane);
  clickable.push(netPlane);

  // 网顶白色标志带
  var tape = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.08, COURT_W + 1.2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  tape.position.set(0, NET_H + 0.1, 0);
  group.add(tape);

  scene.add(group);
}

/* ---------- 7. 排球：Canvas 贴图 + 浮动动画 ---------- */
function buildBall() {
  // 用 2D 画布画排球条纹再当作贴图（无需外部图片）
  var cvs = document.createElement('canvas');
  cvs.width = 256; cvs.height = 128;
  var ctx = cvs.getContext('2d');
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#2a6fb0';
  for (var x = 0; x < 256; x += 64) ctx.fillRect(x, 0, 20, 128);
  ctx.fillStyle = '#e8b23a';
  ctx.fillRect(96, 0, 20, 128);

  var texture = new THREE.CanvasTexture(cvs);
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 24),
    new THREE.MeshLambertMaterial({ map: texture })
  );
  ball.position.set(2.2, 1.6, 0.6);
  ball.castShadow = true;
  ball.userData.zone = 'ball';
  scene.add(ball);
  clickable.push(ball);
}

/* ---------- 8. 灯柱（夜晚点亮） ---------- */
function buildLampPoles() {
  var poleMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
  // 四角灯柱位置
  var spots = [
    [-13, -8], [13, -8], [-13, 8], [13, 8]
  ];
  spots.forEach(function (p) {
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 8, 10), poleMat);
    pole.position.set(p[0], 4, p[1]);
    pole.castShadow = true;
    scene.add(pole);

    // 灯泡：夜晚会发光（emissive）
    var bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 12),
      new THREE.MeshLambertMaterial({
        color: 0xdddddd, emissive: 0x000000
      })
    );
    bulb.position.set(p[0], 8.2, p[1]);
    scene.add(bulb);
    lampBulbs.push(bulb);

    // 点光源：夜晚才开启
    var light = new THREE.PointLight(0xffe9b0, 0, 28);   // intensity=0 白天不亮
    light.position.set(p[0], 8, p[1]);
    scene.add(light);
    lampLights.push(light);
  });
}

/* ---------- 9. 简易看台（三级台阶） ---------- */
function buildStands() {
  var stepMat = new THREE.MeshLambertMaterial({ color: 0xb9b2a7 });
  for (var i = 0; i < 3; i++) {
    var step = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.5 + i * 0.5, 1.2),
      stepMat
    );
    step.position.set(0, (0.5 + i * 0.5) / 2, 9.5 + i * 1.2);
    step.castShadow = true;
    step.receiveShadow = true;
    scene.add(step);
  }
}

/* ---------- 10. 昼夜切换 ---------- */
function setDayNight(night) {
  isNight = night;
  $('#btn-day, #btn-night').removeClass('active');
  $(night ? '#btn-night' : '#btn-day').addClass('active');

  if (night) {
    scene.background.set(0x1a2436);                    // 深蓝夜空
    scene.fog.color.set(0x1a2436);
    ambientLight.intensity = 0.18;                     // 环境光变暗
    sunLight.intensity = 0.05;                         // 太阳几乎熄灭
    lampLights.forEach(function (l) { l.intensity = 0.9; });   // 灯柱点亮
    lampBulbs.forEach(function (b) { b.material.emissive.set(0xffe9b0); });
  } else {
    scene.background.set(0xbfd7ea);
    scene.fog.color.set(0xbfd7ea);
    ambientLight.intensity = 0.55;
    sunLight.intensity = 1.0;
    lampLights.forEach(function (l) { l.intensity = 0; });
    lampBulbs.forEach(function (b) { b.material.emissive.set(0x000000); });
  }
}

/* ---------- 11. 预设机位 ---------- */
function moveTopView() {                        // 俯视全场
  camera.position.set(0, 26, 0.01);
  controls.target.set(0, 0, 0);
}
function moveNetView() {                        // 平视球网
  camera.position.set(11, 2.2, 7);
  controls.target.set(0, 1.4, 0);
}
function resetView() {                          // 默认斜视角
  camera.position.set(14, 10, 14);
  controls.target.set(0, 1, 0);
}

/* ---------- 12. 点击拾取（Raycaster） ---------- */
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();

function onPointerDown(e) {
  // 把点击位置换算成 NDC 坐标（-1 ~ 1）
  var rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  var hits = raycaster.intersectObjects(clickable);
  if (hits.length === 0) return;

  var zone = hits[0].object.userData.zone;
  var info = zoneInfo[zone];
  if (!info) return;

  // 在信息面板中显示该区域说明
  $('#panel-title').text(info.name);
  $('#panel-desc').text(info.desc);
  $('#court-info-panel').show();
}

/* ---------- 13. 渲染循环 ---------- */
function onResize() {
  var container = document.getElementById('scene-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  var t = clock.getElapsedTime();

  // 排球：轻微上下浮动 + 自转，让场景有生命感
  ball.position.y = 1.6 + Math.sin(t * 2) * 0.15;
  ball.rotation.y = t * 0.8;

  controls.update();   // 阻尼必须每帧更新
  renderer.render(scene, camera);
}
