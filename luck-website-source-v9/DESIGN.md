---
name: luck
description: 墨绿绒幕、黄铜转盘与全景荷官牌桌的双游戏演示
colors:
  ink: "#071510"
  header: "#06130e"
  panel: "#102118"
  panel-base: "#0d2118"
  room: "#0a1a12"
  rail: "#0c1d14"
  lobby-card: "#0d2015"
  felt: "#103d2e"
  console: "#071a13e0"
  line: "#314538"
  panel-line: "#33432b"
  brass-line: "#bea671"
  muted: "#a6b7aa"
  lime: "#c1f478"
  lime-hover: "#d3ff98"
  action-ink: "#17230f"
  gold: "#e8c983"
  title-gold: "#f7e9b9"
  prize-gold: "#f3d58c"
  wheel-number: "#fae7af"
  text: "#e7eee8"
  bright: "#eff4e9"
  number-surface: "#10271c"
typography:
  display: {fontFamily: '"Manrope Variable", "PingFang SC", "Microsoft YaHei", sans-serif', fontSize: "46px", fontWeight: 720, letterSpacing: "-0.035em"}
  stage-title: {fontSize: "clamp(27px, 2.6vw, 41px)", fontWeight: 750, letterSpacing: "-0.035em"}
  dealer-title: {fontSize: "38px", fontWeight: 750, letterSpacing: "-0.03em"}
  title: {fontSize: "26px", fontWeight: 700, letterSpacing: "-0.025em"}
  body: {fontFamily: '"Manrope Variable", "PingFang SC", "Microsoft YaHei", sans-serif', fontWeight: 400}
  label: {fontSize: "13px", fontWeight: 650, lineHeight: 1.4}
rounded:
  flat: "0"
  badge: "5px"
  preview: "6px"
  field: "7px"
  button: "8px"
  console-mobile: "10px"
  dealer-room: "12px"
  lobby-card: "13px"
  daily-room: "14px"
  panel: "16px"
  camp-tablet: "18px"
  caption: "20px"
  stage-badge: "25px"
  camp: "16px"
  result-tray: "50px"
  circle: "50%"
spacing:
  tight: "6px"
  compact: "8px"
  control-gap: "10px"
  small: "12px"
  medium: "18px"
  mobile-card-gap: "22px"
  lobby-gap: "24px"
  rail-inset: "28px"
  page-inset: "30px"
  lobby-inset: "32px"
  section-gap: "36px"
components:
  button-primary: {backgroundColor: "{colors.lime}", textColor: "{colors.action-ink}", rounded: "{rounded.button}", padding: "12px 20px", typography: "{typography.label}"}
  button-primary-hover: {backgroundColor: "{colors.lime-hover}"}
  button-secondary: {backgroundColor: "#162c1e", textColor: "#d5e3c3", rounded: "{rounded.button}", padding: "12px 20px"}
  button-subtle: {textColor: "#b5c4ab", rounded: "{rounded.button}", padding: "12px 20px"}
  button-wallet: {backgroundColor: "#bbee76", textColor: "#193113", rounded: "{rounded.button}", padding: "11px 16px"}
  search-field: {backgroundColor: "#0a1e12", textColor: "#d7e3be", rounded: "{rounded.field}", height: "37px", padding: "0 12px"}
  panel: {backgroundColor: "{colors.panel}", textColor: "{colors.text}", rounded: "{rounded.panel}"}
  number: {backgroundColor: "{colors.number-surface}", textColor: "#efefd7", rounded: "{rounded.circle}", size: "54px"}
  number-selected: {backgroundColor: "{colors.lime}", textColor: "#12200b", rounded: "{rounded.circle}"}
  camp: {textColor: "#f5e6bd", rounded: "{rounded.circle}", padding: "0", imageAsset: "curved-betting-table.webp"}
  camp-selected: {outlineColor: "#d2f48d", outlineWidth: "2px"}
  camp-winner: {textColor: "#ffe393"}
  chip: {imageAsset: "table-chip-{value}.webp", rounded: "{rounded.circle}", minHeight: "44px"}
  chip-selected: {translateY: "-7px"}
---

# Design System: luck

## Overview

**Creative North Star: "墨绿开奖厅"**

绒幕、黄铜与金绿灯光构成连续的开奖空间。首页用两张大游戏卡引导进入每日转盘或全景荷官牌桌；摄影质感的图像负责材质，号码、金额、选择与结果由真实 DOM 控件呈现。界面文字品牌使用小写 luck；代币 Logo 使用用户提供的原图，保留皇冠、8 号球、骰子、四叶草与金色 LUCK 飘带。

本文记录当前实现，依据用户批准的 `.impeccable/mocks/approved/daily.png`、`quick.png` 及 `index.html` 方向约定。快速押注区域以用户选定的第二张新效果图 `quick-curved-table.png` 为最新依据。快速场景使用用户提供的视频与同场景参考图，保留白衬衫、深色金边马甲女性荷官与四叶草骰盅；用户明确要求的 0–19 完整 20 格优先于参考图的号码遗漏。

**Key Characteristics:**

- 墨绿空间与金色实物质感，荧光绿标识操作和选择。
- 每日舞台与参与侧栏分区，快速牌桌把三阵营控件融入桌面。
- 图像营造氛围，文字、号码和服务返回的结果保持可访问、可更新。

这是本地 mock 预览，API、真实钱包与合约仍待接入。`.impeccable/review/v2/` 保存截图和直接参考审阅；未建立正式 comp-spec 或 pixel-diff 门禁，不宣称这些门禁已通过。

## Colors

`experience.css` 在 `styles.css` 后加载，覆盖 gold、line、muted，并为房间、侧栏、牌桌与控制台保留不同深绿层次。lime 用于操作、选号和导航；gold 与暖金文字族用于金额、标题、转盘数字和黄铜边。快速控制区不再使用独立面板底色，阵营与筹码透明控件位于摄影素材上，选中状态用lime轮廓、勾选和落筹表示。

上方记录的是角色色，不是照片限色色板。金属高光、绒幕暗部和半透明叠层允许连续色阶。旧 detector 的 137 项是针对旧文档的颜色/圆角建议，不代表 137 个视觉缺陷，不应据此压平当前材质。

## Typography

Manrope Variable 随项目本地加载，中文回退 PingFang SC、Microsoft YaHei、sans-serif；数值采用 tabular-nums。首页主标题 46px / 720，每日标题采用 stage-title，快速标题 38px / 750，首页卡标题 26px / 700。≤600px 首页/每日/快速标题分别为 32/27/26px；≤360px 进一步压缩。

主要说明为 12–16px，辅助数据为 10–13px，小屏部分标签为 8–9px。金额单位紧邻数字且字号较小，明确区分 U 计价、USDT 奖池与 luck 支付。

## Layout

- **框架：** 页头高 74px，内部最大宽度 1500px、横向内边距 38px；≤600px 高 65px、内边距 16px。≤700px 折叠导航。历史、奖池、个人中心使用最大宽度 1360px 的共享内页。
- **首页：** 最大宽度 1440px、横向内边距 32px；两张等宽卡间距 24px，场景高 344px，下接统计和最近开奖。≤800px 双卡纵向堆叠；≤600px 内边距 17px、场景高 300px。
- **每日：** 体验容器最大宽度 1536px，内边距 24px 30px 40px；舞台/侧栏为 `1.85fr / minmax(350px, 1fr)`。侧栏内边距 28px，五列号码，桌面控件 54px 正圆。转盘宽 `min(91%, 580px)`，≥1650px 为 620px。≤800px 改上下排列；≤600px 舞台最小高 570px、转盘宽 94%。
- **快速：** 保留 16:9 荷官场景（最小 480px；≤600px 为 430px），下接 20:7 摄影牌桌，桌面向上叠入 14% 宽度并渐隐衔接。三列原生按钮位于照片的金色领地内，中央按钮宽为列宽 86%、以 lime 椭圆轮廓表示选中；两侧文字轻转 ±3°，选中筹码位于文字旁。近处黑皮桌沿承载引导、四槽黄铜筹码盘、金额、倍数和确认。601–1100px 保持照片比例，在下方增加 105px 控制区；≤600px 使用 1.3:1 单独手机牌桌，领地不裁掉，控制区自然流纵向排列。

体验层主要断点为 1650、1250、1000、800、600、360px；共享页面保留 1450、1350、1120、900、700、380px 调整。≤600px 两个房间贴屏、移除外圆角。body 最小宽度 280px；v2 图像证据覆盖约 1440/390px，不代表所有中间宽度都已视觉验收。

## Elevation & Depth

图像中的金属、灯光、绒幕和基座提供主要立体感；界面以细黄铜边、深绿表面和透明叠层承载信息。结果托盘使用 `0 10px 20px #0004`，快速结果使用 `0 12px 30px #0005`，选中号码为 `0 4px 8px #0004`。钱包、弹窗和 toast 延续共享阴影；不要给每块信息添加厚重悬浮阴影。

## Shapes

按钮 8px，共享面板/弹窗 16px，每日房间 14px，首页卡 13px，快速房间 12px；近处控制台直接位于桌沿，不再有面板边框或圆角。快速阵营按钮是透明的照片领地，中央选择轮廓为椭圆；筹码按钮为透明照片，黄铜槽与皮革不由 CSS 绘制。5–7px 用于徽标/预览按钮/字段，20–25px 用于文字胶囊，结果托盘为 50px。号码、筹码和倒计时保持圆形，玩法下划线保持平直；不把不同职责统一为单一圆角。

## Components

- **牌桌资产：** `curved-betting-table.webp`（1600×560）与手机版（1170×900）负责绿绒领地、金边和黑皮桌沿；`table-chip-tray.webp`（900×300 RGBA）包含四个空黄铜槽，`table-chip-{1,5,10,50}.webp`（256×192 RGBA）为真实透明筹码图。按槽中心 17.5% / 38.7% / 59.9% / 81.1% 定位，图片不拉伸。
- **资产：** 每日使用 `draw-stage.png`、`luck-wheel.png`；快速使用用户提供视频中央的无水印摇骰动作与新参考图房间两侧羽化融合的 `dealer-shake-10s.mp4`（1280×720 / 24fps / 10 秒）及其首尾帧 `dealer-video-idle.jpg`、`dealer-video-end.jpg`；旧姿态图作为历史素材保留。文件位于 `public/assets/`，生成 PNG 嵌入提示并在 `.impeccable/assets/` 保留 sidecar。最终代币 Logo 是用户提供的 `luck-token-logo.jpg` 原图，未经生成或重绘，用于页头品牌、favicon、真实模式待接入页和转盘中心；中心叠图宽高为转盘的 28%，保留金边与完整 20 格号码。旧缓存的 `luck-mark.svg` 路径由品牌组件映射到该原图。
- **开奖：** 转盘 0–19 由 DOM 生成，每格 18°；固定指针指向 `round.result`，下方六位逐个揭晓，每位 3200ms、旋转缓动 2850ms。快速最后 10 秒封盘，用户提供的摇骰视频按期次开始时间播放一次；首帧待机，结束后停在尾帧等待数据，收到结果才显示骰子与阵营。视频不揭开骰盅、不决定结果。默认静音，可主动开启原音；隐藏、离屏时暂停，恢复后同步当前时间。
- **选择：** 号码使用 `aria-pressed`，选中为实心 lime。快速三个阵营是具名 `group` 中的原生按钮，采用 `aria-pressed`、勾选与中央选中轮廓；规则及奖池通过 `aria-describedby` 关联。筹码提供 1/5/10/50 倍透明照片和自定义输入，草稿初始为豹子/1倍。
- **交互：** 主按钮最小高 44px，快速确认桌面至少 58px、手机 46px；共享钱包按钮更紧凑。可用通用按钮按下下移 1px；通用键盘焦点为 2px lime 轮廓、4px 偏移，新的筹码与领地使用 3px lime 焦点轮廓。通用过渡 0.18s，筹码悬停 200ms；点击领地的落筹为 520ms 指数缓出，切换阵营替换草稿，确认后才参与。自定义面值用 1 倍照片与倍数标记；封盘禁用并保留可读状态。视频声音按钮和手机筹码最小高 44px；手机手动播放回退按钮纵向排列，避开上期结果。
- **减少动态：** reduced-motion 使用静态荷官首尾帧，保留结果与状态；停用计时呼吸、结果入场及其他空间移动，转盘直接展示最终结果，加载图标停止旋转。
- **环境光影：** 独立的 `CasinoLight` 在首页游戏场景、每日舞台和快速牌桌内叠加暖金色四叶草/菱形散焦投影与吊灯反光，沿用 `--gold`。使用柔光、缓慢摆动和连续渐隐，不加入闪烁；牌桌中心遮罩保留人物与骰盅清晰度，光层不接收指针事件。手机降低透明度；Canvas 最长边 960px、最多约 24fps，离屏与页面隐藏时暂停，减少动态模式显示静态帧。不依赖 React Bits Pro 授权组件。
- **首页立体卡片：** `TiltCard` 保留现有两张游戏卡的内容和 13px 圆角，用固定外层读取鼠标位置，内部卡面倾斜 X ±3.5° / Y ±4.5°、上移 4px。暖金反光由 `--gold` 16% 透明混合形成，悬停阴影 `0 22px 34px -20px #000b` 表达卡片离开桌面的深度，只在悬停时出现。跟随缓动 160ms，复位 480ms；≤800px、触屏与减少动态模式不倾斜。焦点反馈保留金边和绿色轮廓。801–1000px 阵营名称与金额纵向排列，避免“豹子”断行。实现独立于官方 Credit Card。
- **文字散开：** 首页 `LobbyHeadline` 在鼠标进入时启动逐字散开：横向最多 0.35em、向上最多 0.835em、旋转最多 22°，1.25–1.41 秒自然落回，提前移开时 480ms 复位；再次进入可重播。“幸运”沿用金色。固定原句、桌面单行与手机逗号后两行，不再自动轮换。字形不接收指针，标题容器保持稳定；600px 以下、触屏和减少动态模式静态显示，隐藏、失焦与媒体条件变化时清理动画。阶段标签、倒计时和金额不使用此效果。
- **反馈：** 保留演示提示、报价来源与单位，确认中锁定提交，过期报价可重取；加载、空记录、错误、成功和余额不足沿用现有组件。每日封盘可先挑下一组号码但不可提交本期；快速封盘禁用阵营、筹码和确认。真实模式显示待接入，不回退到 mock。

## Do's and Don'ts

- **Do** 延续双游戏首页、金绿转盘舞台与用户参考图中的白衬衫、深色金边马甲全景荷官牌桌。
- **Do** 保持 0–19 全部 20 格、六个揭晓位和服务拥有的结果数据。
- **Do** 用真实文字与按钮承载金额、状态、选择、焦点和支付流程。
- **Do** 保留资产来源、演示标识、U/USDT/luck 区分与减少动态效果支持。
- **Don't** 把用户提供的 AI 视频描述为真人直播，把本地演示描述为真实资金服务。
- **Don't** 新增第三游戏、固定赔率承诺，或重绘、改写用户提供的最终代币 Logo。
- **Don't** 为旧文档的检测建议压平照片材质、透明叠层或当前圆角家族。
