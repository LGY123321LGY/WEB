# Research Cockpit

应用源码在这个目录。产品说明、线上演示、预览图和许可都在仓库根目录的 [README](../README.md)。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
cd research-cockpit
npm ci
npm run dev
```

开发服务器监听 `0.0.0.0`。可选地复制环境变量后再启动：

```bash
cp .env.example .env
```

需要 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`。留空时，工作台数据留在浏览器本地。不要提交 `.env`，也不要把 `service_role` 放进前端变量。

在 Zotero 里打开论文时，先让本机 Zotero 9 开启本地 API（`127.0.0.1:23119`）。Vite 会把 `/zotero-api` 代理过去。

数据库迁移与 GitHub 登录见 [supabase/README.md](supabase/README.md)。
