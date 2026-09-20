# 管理端简版 CI/CD

工作流：`.github/workflows/ci-cd.yml`。

## 日常使用

- 提交 PR 或推送到 `main` / `master`：使用 Node.js 22 执行 `npm ci`、`npm run build`，包含 TypeScript 检查。
- CI 以 `package-lock.json` 为准；修改依赖时使用 npm 并同步更新该锁文件。保留原有 pnpm 锁文件供现有开发环境使用，CI 不读取它。
- 构建产物 `admin-提交号` 保留 7 天，内含 `admin.tar.gz`。
- 发布：工作流合并到默认分支后，打开 **Actions → 管理端 CI/CD → Run workflow**，选择默认分支并勾选 `deploy`。构建通过后部署本次产物；其他分支不能发布。

## 一次性配置

在本仓库 **Settings → Secrets and variables → Actions** 配置 Repository secrets：

| 名称 | 内容 |
| --- | --- |
| `SSH_HOST` | 现有服务器 IP 或域名 |
| `SSH_USER` | 能执行 `sudo -n bash` 的部署账号 |
| `SSH_PRIVATE_KEY` | 完整 SSH 私钥，保留换行 |
| `SSH_KNOWN_HOSTS` | 已通过服务器控制台核验指纹的 known_hosts 记录 |

SSH 端口默认 22，可通过 Repository variable `SSH_PORT` 修改。非默认端口的 known_hosts 主机名应为 `[主机]:端口`。两个仓库的 Secrets 需要分别配置。

服务器需要已有 Nginx 站点：`xixutech.cn` 的 HTTPS 根目录指向 `/www/wwwroot/campusX/current`，该路径是指向可用旧版本的软链接。需要 `bash`、`curl`、`flock`、`tar`、`sudo`。

构建时 `VITE_BACKEND_PREFIX` 留空，浏览器通过同源 `/api`、`/images` 访问后端，复用现有 Nginx 转发规则。

## 部署行为

新版本解压到 `/www/wwwroot/campusX/releases/提交号-运行编号-重试次数/`，保留旧的哈希资源，原子切换 `current`；无需重启 Nginx。通过本机 HTTPS 站点检查 `revision.txt` 是否为本次版本，失败则恢复旧软链接并将工作流标记失败。

与后端共用服务器部署锁。历史版本和累计静态资源不会自动删除，需定期清理；保留近期仍被打开页面引用的资源。此流程不修改后端、数据库或 Nginx 配置。

本地验证：`npm ci --no-audit --no-fund`，然后 `npm run build`。CI 暂未加入浏览器端到端测试。
