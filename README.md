# KAPIO · 新和联胜·刀塔堡垒

社团公开主页：<https://kapio-dota2.netlify.app/>。

静态 HTML、CSS 和 JavaScript，包含对黑战报、视频号作品入口、社团成员与发条酒仙介绍。

## 本地预览

```sh
python -m http.server 8680 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:8680/`。无需安装依赖或执行构建。

## Netlify

在现有 Netlify 项目中连接此仓库，发布分支为 `main`，发布目录为 `dist`，构建命令留空。配置已写入 `netlify.toml`。

## 内容维护

- `dist/index.html`：首页及成员名录，关闭 JavaScript 仍可浏览成员。
- `dist/content.json`：五场公开战报入口；档案范围与成员十场统计范围分别标注。
- `dist/members.json`：公开成员称呼、登场场数和本批英雄摘要，不包含账号映射。
- `dist/channels.json`：四条微信视频号作品链接，视频号页面负责播放。
- `dist/assets/`：网页展示图片、原版社团标志和短自介。

成员登场信息来自本批十场对黑。已确认的多账号按社团称呼合并，公开文件不包含内部账号登记、数据库、密钥、回放或制作素材。
