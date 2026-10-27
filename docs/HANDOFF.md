# 波次远征 · 开发交接

日期：2026-10-27  
创建人：ScarfQian  
版本：0.4.0 · 修改编号：`20261027-009`

唯一目录：`/Users/qianweijin/Library/Mobile Documents/com~apple~CloudDocs/10-开发/2-Game/2-鹈鹕骑士-波次远征`。

用户已批准合并原 PR #1，并复制目录、建立新项目。原仓库 main 已合并 `4ce07ded5835f9abb83c41018b4ea4f439b46a8b`，原 Pages 已读取确认 0.3.2。本项目为 [pelican-knight-waves](https://github.com/ScarfQian/pelican-knight-waves)，[在线入口](https://scarfqian.github.io/pelican-knight-waves/)。美术沿用原版，玩法在这里独立维护，禁止回写原项目。

`index.html` 是唯一开发入口，`version.json` 登记发布。0.4.0 为新项目首版；0.1.0—0.3.2 快照、旧日志和美术 PNG 来自原项目，不覆盖。当前规则优先看 README 与计划 V3，历史横版说明不适用于本入口。

## 当前机制

- x/d 等比例八方向移动，双轴相机，z 独立跳跃；沿用角色、装备和车辆挂点与图形。
- 30 波有限队列。普通敌人数 `5+floor(wave*1.1)`，每 5 波额外一精英，30 波额外首领。队列全出且敌人全清后才能结算。
- 每波选一次卡。六次精英奖励为 2—7 倍基础增益，页面显示按能力剩余上限计算的实际增益。
- 10/20/30 波顺序：清场 → 自动收掉落 → 精英卡 → 精粹强化。30 波强化后通关，其他波 3 秒后继续。
- 四装备槽最高 +5；精粹和强化均在局内。失败/主动结束清零；通关保存完整配置，下一地图入口禁用。
- 自动普攻，保留六武器特色和四坐骑能力。主动动作可打断自动攻击，避免输入窗口被自动攻击持续占用。
- 营地免费换装；学堂显示卡片说明，行政厅显示目标和纪录。取消本项目的永久天赋、强化、海贝和领奖。

## 代码位置

| 标识符 | 职责 |
| --- | --- |
| `WAVE_LIMIT` / `COAST` / `CAMP` | 波数与区域；当前仅第一地图 |
| `townLayout` / `drawScene` | 场景实例布局，不改固定资产 |
| `makeGame` / `startGame` | 每局初始化；装备 +0、卡片空、精粹 0 |
| `beginWave` / `spawnDirector` / `completeWave` | 有限队列、在场上限、清场判定 |
| `offerUpgrades` / `chooseUpgrade` | 品质、一次奖励、阶段推进 |
| `openForge` / `forge` | 强化费用、等级上限和补给 |
| `completeMap` / `resumeCheckpoint` | 保存和恢复已通关配置，不进入未实现地图 |
| `finish` / `clearRunGrowth` / `recordRun` | 结束清零、纪录去重、保存 |
| `stats` / `refreshStats` | 基础装备、卡片、局内强化派生属性 |
| `frontTarget` / `aimAt` / `melee` / `shotHits` | 二维目标、近战扇形、弹丸命中 |
| `updatePlayer` / `updateEnemies` / `render` | 八方向动作、预警与相机、地面遮挡排序 |
| `cleanCheckpoint` / `persist` | 独立存档校验和错误提示 |

## 存档契约

键 `pelican-waves-save-v1`，schema 1，project `pelican-knight-waves`。保存 loadout、settings、records、lastSettlement、可选 checkpoint。原版键不读取。checkpoint 包含 id/map/cleared/loadout/build/gear/cards/essence/hp/mounted/kills/time，只接受 coast 完成 30 波的节点。

失败和结束不能复用 build、gear、cards、essence；通关回营地属于同一远征，营地换装不改写它的 loadout。开始新远征须确认清除旧配置。未来第二地图须扩展地图登记、checkpoint 校验、累计结算及续接逻辑，不能只打开按钮。当前不保存战斗、选卡或强化页中的进度。

## 固定美术与验证

图形源 `assets/sprites.svg` 完全未改，40 个 ID 与运行键保留。`rig-pelican`、帽巾、武器、车辆用原挂点，围巾 tail 只旋转组，禁止写回旧轮廓。旧珍珠图形在本项目用于精粹。

catalog 增加本项目使用说明，原 definition 是基础资产参数；波次倍率、实例坐标、局内强化由当前入口计算。`python3 tools/sync_assets.py --check` 为静态同步检查，不运行游戏。继承的 PNG 反映同一套图形，无需重画。

已核对语法、静态 ID/引用、源同步、快照及文档链接，审阅核心状态转换。按用户此前要求不使用 Skill、不运行游戏或游戏测试；未试玩、未作移动端或性能测试，手感与可通关性尚未验证。

下一步仅在用户授权后试玩 5/10/20/30 波、强化扣款、结束清零、通关配置恢复，再调数值。第二地图、新怪物、高级武器与更多参考系统等待后续需求。

首次发布初始化新 main；之后分支开发，按指令提交/推送/建 PR，由用户逐次决定是否合并。Pages 从 main 根目录发布。
