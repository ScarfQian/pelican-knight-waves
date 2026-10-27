#!/usr/bin/env node
// 静态 PNG 资产总览。日期：2026-10-27；创建人：ScarfQian。
// 只读取已同步图鉴，不启动浏览器、游戏或存档。需要环境中已有 sharp。
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
// 拒绝用新目录配旧图鉴生成参考图，避免同名资产出现两套造型。
execFileSync('python3', [path.join(root, 'tools/sync_assets.py'), '--check'], { stdio: 'inherit' });
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/catalog.json'), 'utf8'));
const gallery = fs.readFileSync(path.join(root, 'docs/assets.html'), 'utf8');
const defs = gallery.match(/<defs>([\s\S]*?)<\/defs>/)[1];
const previews = [...gallery.matchAll(/<svg class="asset-preview" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/g)];
if (previews.length !== catalog.entries.length) throw new Error('请先运行 python3 tools/sync_assets.py');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const width = 1600, columns = 4, cellW = 384, cellH = 272, gap = 10, startY = 142;
const height = startY + Math.ceil(catalog.entries.length / columns) * (cellH + gap) + 45;
const categories = {character:'人物',monster:'怪物',weapon:'武器',apparel:'穿戴',mount:'车辆',building:'建筑 / 设施',prop:'辅助物件',legacy:'历史保留'};
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><defs>'+defs+'</defs>';
svg += '<rect width="100%" height="100%" fill="#eef1e6"/><g font-family="PingFang SC,Arial,sans-serif" fill="#264b48">';
svg += '<text x="24" y="49" font-size="31" font-weight="600">鹈鹕骑士 · 固定资产总览</text>';
svg += '<text x="24" y="82" font-size="15" fill="#718574">资产库 '+esc(catalog.libraryVersion)+' · '+catalog.entries.length+' 张卡片 · 日期 '+esc(catalog.date)+' · 创建人 '+esc(catalog.creator)+'</text>';
svg += '<text x="24" y="111" font-size="14" fill="#8a8e70">'+esc(catalog.visualRevision.summary)+'</text>';
catalog.entries.forEach((entry, i) => {
  const x = 24 + (i % columns) * (cellW + gap), y = startY + Math.floor(i / columns) * (cellH + gap);
  svg += '<rect x="'+x+'" y="'+y+'" width="'+cellW+'" height="'+cellH+'" rx="12" fill="#fffcf0" stroke="#d0dbc4"/>';
  svg += '<rect x="'+(x+10)+'" y="'+(y+10)+'" width="'+(cellW-20)+'" height="163" rx="8" fill="#e6ecda"/>';
  svg += '<svg x="'+(x+52)+'" y="'+(y+22)+'" width="'+(cellW-104)+'" height="140" viewBox="'+previews[i][1]+'" preserveAspectRatio="xMidYMid meet">'+previews[i][2]+'</svg>';
  svg += '<text x="'+(x+18)+'" y="'+(y+197)+'" font-size="12" fill="#7c8d73">'+esc(entry.id)+' · r'+entry.revision+' · '+categories[entry.kind]+'</text>';
  svg += '<text x="'+(x+18)+'" y="'+(y+225)+'" font-size="21" font-weight="600">'+esc(entry.name)+'</text>';
  svg += '<text x="'+(x+18)+'" y="'+(y+251)+'" font-size="11" fill="#889179">图形 '+esc(entry.visual.id)+'</text>';
});
svg += '<text x="24" y="'+(height-17)+'" font-size="12" fill="#84917a">来源：assets/catalog.json + assets/sprites.svg · 游戏与图鉴共用 · 旧版条目不自动接入当前玩法</text></g></svg>';
const output = path.join(root, 'docs/assets-overview.png');
// 用相同骨架组装换装与骑乘预览；旧版从不可变快照读取，只用于对照。
const detailData = JSON.parse(execFileSync('python3', ['-B', '-c', `
import sys, json, re, copy, xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / 'tools'))
from sync_assets import read_sources, preview, SVG_NS
c, nodes, _ = read_sources()
hero = next(e for e in c['entries'] if e['id'] == 'CHR-001')
old = (Path(sys.argv[1]) / 'versions/v0.3.1/index.html').read_text()
old_c = json.loads(re.search(r'<script type="application/json" id="asset-catalog">(.*?)</script>', old, re.S).group(1))
old_defs = re.search(r'<defs>(.*?)</defs>', old, re.S).group(1)
old_root = ET.fromstring('<svg xmlns="'+SVG_NS+'"><defs>'+old_defs+'</defs></svg>')
old_nodes = {e.get('id'): e for e in old_root.iter() if e.get('id')}
old_hero = next(e for e in old_c['entries'] if e['id'] == 'CHR-001')
variants = []
for weapon, mount, hat, scarf, mounted, label in [
 ('bow','bicycle','sailor','red',False,'木弓 · 步行'),
 ('shield','bicycle','sailor','red',True,'刀盾 · 普通自行车'),
 ('hammer','mountain','guard','breeze',True,'巨锤 · 山地车'),
 ('katana','road','sailor','red',True,'太刀 · 公路车'),
 ('staff','motor','guard','breeze',True,'法杖 · 摩托车'),
 ('shotgun','motor','guard','breeze',False,'散弹枪 · 步行')]:
 e = copy.deepcopy(hero)
 e['visual']['loadout'] = dict(weapon=weapon,mount=mount,hat=hat,scarf=scarf)
 e['visual']['mounted'] = mounted
 variants.append(dict(label=label,svg=preview(e,c['entries'],nodes)))
print(json.dumps(dict(beforeDefs=old_defs,before=preview(old_hero,old_c['entries'],old_nodes),after=preview(hero,c['entries'],nodes),variants=variants),ensure_ascii=False))
`, root], { encoding: 'utf8', cwd: root }));
const prefixBefore = text => text.replace(/\bid="([^"]+)"/g, 'id="before-$1"').replace(/href="#/g, 'href="#before-');
function placePreview(markup, x, y, w, h, viewBox) {
  const match = markup.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+(viewBox || match[1])+'" preserveAspectRatio="xMidYMid meet">'+match[2]+'</svg>';
}
let detail = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><defs>'+defs+prefixBefore(detailData.beforeDefs)+'</defs><rect width="1600" height="1100" fill="#eef1e6"/><g font-family="PingFang SC,Arial,sans-serif" fill="#264b48">';
detail += '<text x="32" y="50" font-size="30" font-weight="600">鹈鹕骑士 · 造型修订与组合预览</text><text x="32" y="83" font-size="15" fill="#718574">CHR-001 · r1 → r2 · 2026-10-27 · 创建人 ScarfQian · 从资产源静态组装</text>';
for (const [i, title, art] of [[0,'修订前 · v0.3.1',prefixBefore(detailData.before)],[1,'当前 · v0.3.2',detailData.after]]) {
  const x = 24 + i * 788;
  detail += '<rect x="'+x+'" y="110" width="764" height="505" rx="14" fill="#fffcf0" stroke="#d0dbc4"/><text x="'+(x+24)+'" y="151" font-size="21" font-weight="600">'+title+'</text>';
  detail += '<rect x="'+(x+16)+'" y="170" width="732" height="418" rx="10" fill="#e6ecda"/>';
  detail += placePreview(art,x+23,200,335,335);
  detail += placePreview(art,x+390,235,345,260,'4 -105 62 55');
  detail += '<text x="'+(x+64)+'" y="567" font-size="14" fill="#718574">完整站姿 · 原挂点</text><text x="'+(x+454)+'" y="567" font-size="14" fill="#718574">头部与嘴部细节</text>';
}
detail += '<text x="32" y="661" font-size="23" font-weight="600">同一身体 · 六种武器 / 四类车辆 / 两套穿戴</text>';
detailData.variants.forEach((variant,i) => {
  const x=24+i*262;
  detail += '<rect x="'+x+'" y="686" width="252" height="336" rx="12" fill="#fffcf0" stroke="#d0dbc4"/>';
  detail += placePreview(variant.svg,x+12,706,228,238);
  detail += '<text x="'+(x+18)+'" y="978" font-size="17" font-weight="600">'+esc(variant.label)+'</text>';
});
detail += '<text x="32" y="1065" font-size="14" fill="#718574">上方为静态放大对照；下方引用同一骨架、装备与车辆。预览不运行游戏、不读取存档，不代表动作或玩法验收。</text></g></svg>';
(async () => {
  await sharp(Buffer.from(svg)).png().toFile(output);
  await sharp(Buffer.from(detail)).png().toFile(path.join(root,'docs/assets-detail.png'));
  console.log('PNG 已生成：assets-overview.png ('+width+' × '+height+')；assets-detail.png (1600 × 1100)');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
