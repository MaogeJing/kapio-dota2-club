# KAPIO · 新和联胜·刀塔堡垒

社团公开主页：<https://kapio-dota2.netlify.app/>。

静态 HTML、CSS 和 JavaScript，包含对黑战报、视频号作品入口、社团成员与发条酒仙介绍。

## 本地预览

```sh
python -m http.server 8680 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:8680/`。无需安装依赖或执行构建。

## Netlify：仅手动部署

GitHub 用于源码版本管理。为控制免费额度，Netlify 不连接 Git 自动构建，代码提交和推送均不触发部署；不添加 push、定时任务或自动发布工作流。

需要发布时，在仓库目录手动执行：

```sh
npx netlify-cli deploy --prod --dir dist --no-build --site kapio-dota2
```

首次使用需运行 `npx netlify-cli login`，在官方网页完成账号授权。登录凭据由 CLI 管理，不写入仓库。发布目录为 `dist`，无需构建，配置见 `netlify.toml`。

本地修改 → 本地核验 → 提交/推送 GitHub → 管理员明确要求发布 → 手动部署。

## 内容维护

- `dist/index.html`：首页及成员名录，关闭 JavaScript 仍可浏览成员。
- `dist/content.json`：五场公开战报入口；档案范围与成员十场统计范围分别标注。
- `dist/members.json`：公开成员称呼、登场场数和本批英雄摘要，不包含账号映射。
- `dist/channels.json`：四条微信视频号作品链接，视频号页面负责播放。
- `dist/assets/`：网页展示图片、原版社团标志和短自介。

成员登场信息来自本批十场对黑。已确认的多账号按社团称呼合并，公开文件不包含内部账号登记、数据库、密钥、回放或制作素材。
