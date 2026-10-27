# 掌门杀 · 修真门派掌门路

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

一款运行在浏览器中的**修真主题身份竞技卡牌游戏**（类《三国杀》机制）：玩家扮演楚秦门、齐云诸家、白山、御兽门、魔修、鬼修、蛮荒古兽等**116 名**角色，在「掌门／弟子／长老」对「邪修／鬼修／魔修／兽类」的身份局中出牌博弈——以**神通**攻敌、**护身**挡灾、**灵丹**续命、**悟道**破境，并可立**灵魂契约**歃血为盟。

世界观、角色、技能、法宝、灵根、本命、势力、地域、灵地、契约**全部取自** `docs/`（《修真门派掌门路》设定库），**术语严禁新造**。

> 本工程由单文件 HTML 游戏重构为 **TypeScript 模块化工程**，并可完整编译回**单一 HTML 文件**，双击即玩、零部署成本。

## 功能特性

- **完整卡牌体系**：138 张牌（神通 / 护身 / 灵丹 / 灵药 / 悟道 / 符篆·阵法·秘术 / 法宝 / 灵地），含判定区（天劫 / 七星定身阵）、距离与攻击范围、法宝四槽、本命法宝射程
- **116 名角色**：人类 91、兽类 14、魔修 7、鬼修 4；覆盖练气→化神五境二十层；55 项技能；御兽门 13 人各携伴兽池
- **四方身份局**：正道（掌门／弟子／长老／客卿／执事）、外道（邪修／鬼修／魔修／兽类）、隐匿（散修／黑手／公正鬼）、公开高位（座主／老祖／镇守／界主／城主），**人数自适应配比**
- **灵魂契约**：以真名录于羊皮纸，凉风扫过而成立，心头锁为记；背盟遭灵魂反噬（公正鬼在场时升格为致命）
- **境界成长**：练气→筑基→金丹→元婴→化神，每境四阶共 20 层；悟道／闭关／感悟三条修为途径；**灵地阶位**为跨境突破的第二前置条件
- **悟道判定**：翻判定牌，红色「道心澄明」、黑色「心魔滋生」，灵根纯度修正成败（单灵根命中花色则结果翻转）
- **AI 双机制（启发式 + 大模型）**：默认启发式博弈 AI（信念推断 + 目标评分）；可接入 OpenAI 兼容大模型（DeepSeek／通义／智谱／Ollama 本地等）接管全部或指定 AI 座位，过慢或失败自动回退启发式，**零死锁**
- **主题与响应式**：顶栏 🎨 切换光线模式（白昼／夜幕／黄昏）× 仙侠配色（玉青／鎏金／黛蓝／紫宸／赤焰／雪松）；对局时**大屏椭圆牌桌、小屏列表**双形态自适应
- **联机对战**：PeerJS 房主权威架构，6 位房号建房／加入，实时同步牌局、战报、聊天；掉线自动转 AI
- **本地档案**：积分、胜场、阵营统计、主题偏好（localStorage）

## 快速开始

```bash
npm install        # 首次安装依赖
npm run dev        # 开发服务器（HMR）
npm run build      # 构建两种模式到 dist/
```

无需服务器，直接打开构建产物即可游玩：

| 产物 | PeerJS 方式 | 适用场景 |
|---|---|---|
| `dist/掌门杀.html` | CDN script 标签 | 体积最小（约 174 KB），需联网联机 |
| `dist/掌门杀.bundled.html` | 内嵌 peerjs 包 | 完全自包含（约 260 KB），联机可离线 |

## 命令一览

| 命令 | 说明 |
|---|---|
| `npm run dev` / `npm run dev:bundled` | 开发服务器（对应两种 PeerJS 模式） |
| `npm run build` | 同时构建两种模式 |
| `npm run build:cdn` / `npm run build:bundled` | 单独构建某一模式 |
| `npm run typecheck` | TypeScript 严格模式检查（`tsc --noEmit`） |
| `npm run smoke` | 单机对局闭环冒烟（开局 → AI 对战 → 结算） |
| `npm run smoke:cards` | 牌堆构成与术语合规 |
| `npm run smoke:roster` | 角色名册（116 人）完整性与术语合规 |
| `npm run smoke:roles` | 身份池与人数自适应配比 |
| `npm run smoke:contract` | 灵魂契约机制 |
| `npm run smoke:wudao` | 境界成长与悟道判定 |
| `npm run smoke:net` | 联机协议 |
| `npm run smoke:ui` | 浏览器 UI 冒烟（大厅 / 牌桌 / 主题与大模型面板 / 响应式 / 零控制台错误） |
| `npm run verify:dist` | 产物自包含单文件校验 |
| `npm run clean` | 清理 dist |

> 冒烟测试使用 `playwright-core`，首次需安装浏览器：`npx playwright install chromium`。

## 工程架构

```
src/
├── main.ts            # 入口：挂载 window 全局（内联 onclick）+ 初始化序列，无游戏逻辑
├── globals.d.ts       # 模板内联函数与调试钩子的全局声明
├── core/              # types.ts（领域类型 + NetMessage）dom / shuffle / sound / fx
├── data/              # camps / powers / regions / lingdi / realms / roles / contracts
│                       # characters(116) / beasts / daoVerses / cards(138)
│                       # cardCatalog / spellTricks / skilldefs(55)
├── game/              # 引擎：state(G) rules realm wudao contract roles beasts damage
│                       #      actions skills skillEngine turn ai(+aibrain) loop
│                       #      choice(Promise 桥) marks log chat setup
├── llm/               # 大模型接管决策链：types / config / client / agent / prompts
├── net/               # protocol / network / rooms / peer.cdn / peer.bundled
├── profile/           # localStorage 档案（积分 / 胜场 / 主题）
└── ui/                # render(单一重渲染入口) lobby playzone hand modals settle
                        # theme(主题系统) llmSettings(大模型设置)
scripts/               # build/dev 包装、冒烟测试、产物校验
docs/md/               # 《修真门派掌门路》设定库（唯一术语权威口径）
docs/raw/              # 原始卷宗（md 无对应词时补充并标注来源）
docs/game/             # 游戏文档：README / 游戏机制 / 玩法 / 卡牌 / 架构设计
```

**关键设计**

- **单一状态驱动渲染**：全局 `G` 状态对象 + 顶层 `render()` 全量重绘（无框架）
- **房主权威联机**：房主运行游戏循环并广播 `state_sync` 快照（80ms 防抖）；远程选择经 Promise 桥接；断线自动转 AI
- **PeerJS 双模式**：`VITE_PEERJS_MODE=cdn|bundled` 经 Vite alias 切换 `#peer` 实现
- **AI 双机制**：`ai.ts` 的 `enumerateActions` / `executeAction` 抽象出统一动作层，启发式与大模型共用；LLM 失败自动回退
- **双形态 UI**：桌面椭圆牌桌（座位绝对定位环绕）+ 窄屏列表（CSS `!important` 覆盖内联坐标）
- **模块化不变量**：`G` 字段形状不可变（联机序列化依赖）；内联模板调用的函数必须在 `main.ts` 挂载并在 `globals.d.ts` 声明；模块间允许函数级循环引用但禁止顶层副作用

## 玩法规则

- **身份**：掌门（公开）需肃清全部外道与隐匿方；弟子／长老护掌门；邪修／鬼修／魔修／兽类弑掌门夺权；散修独善其身；黑手隐匿到最后单挑独胜；公正鬼监督契约
- **回合**：判定（天劫 / 七星定身阵）→ 摸牌 2 → 出牌 → 弃牌（上限 = 寿元）→ 回合末「闭关」
- **出牌**：使用【悟道】、发动主动技／本命天赋、使用法宝、占据灵地、打出符篆／阵法／秘术、立灵魂契约、使用神通攻击
- **资源**：**灵力**由境界派生、回合回复（+2），用于施法与悟道；**道心**仅由悟道成功产出，用于抵伤（2 抵 1）、当护身、濒死自救
- **成长**：悟道（+4 修为，成功 +1 道心）／闭关（弃光手牌 +3 修为）／感悟（濒死被救 +1）

完整规则见 [docs/game/游戏机制.md](./docs/game/游戏机制.md)，上手指南见 [docs/game/玩法.md](./docs/game/玩法.md)。

## 文档

| 文档 | 内容 |
|---|---|
| [AGENTS.md](./AGENTS.md) | AI 协作指南与关键不变量 |
| [docs/game/README.md](./docs/game/README.md) | 游戏文档索引 |
| [docs/game/游戏机制.md](./docs/game/游戏机制.md) | 身份、灵魂契约、境界成长、结算优先级、角色名册、术语禁用清单 |
| [docs/game/玩法.md](./docs/game/玩法.md) | 面向玩家的上手指南：开局、回合、出牌、契约、胜负判定 |
| [docs/game/卡牌.md](./docs/game/卡牌.md) | 卡牌完整参考：牌类、牌堆构成、符篆阵法秘术清单、法宝、灵地 |
| [docs/game/架构设计.md](./docs/game/架构设计.md) | 模块职责、数据流、构建管线、主题与 AI 双机制 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |

## 技术栈

TypeScript 5.6（strict）· Vite 5 · vite-plugin-singlefile · PeerJS 1.5 · Playwright（测试）· esbuild（冒烟脚本打包）

## 许可

Private project. 设定资料版权归原作者所有。
