# Open Listen 发布与更新

代码与安装包仓库：https://github.com/xxxbaiovo/open-listen

## 使用者

从 Releases 下载 Windows x64 的 `*-Setup.exe` 安装版。首次从本地测试版本切换时安装一次，此后可在应用内检查、下载并安装更新。旧测试版仍指向上游，不能自动迁移到本渠道。

程序内部名称、appId 和用户数据目录暂时保留，以兼容已有歌单、设置和安装路径。升级前建议备份 `%APPDATA%/any-listen`。压缩包解压运行的版本不保证自动安装更新，推荐使用安装版。

## 发布新版

1. 在 `packages/desktop/package.json` 提升版本号，例如 `0.9.2`。
2. 更新 `packages/desktop/publish/changeLog.md` 及 `version.json`（version、desc、time、history）。将旧版说明放入 history。
3. 提交并推送 main，再创建和推送同版本标签，例如 `v0.9.2`。
4. GitHub Actions 自动构建 Windows x64 安装包并创建草稿 Release。检查草稿附件完整后发布草稿。

必须同时提供：`*-Setup.exe`、相应 `.blockmap`、`latest.yml`、`version.json`。不要只上传 exe。更新器用 latest.yml 校验 SHA-512；version.json 与安装包在同一 Release 发布，避免提前提示尚不可下载的版本。稳定版本使用递增的正式版本号；本流程暂不发布预览更新渠道。

工作流只需 GitHub 自带的 GITHUB_TOKEN，不需要个人 Token、独立服务器或付费 API。工作流构建失败时不会发布更新。当前没有配置 Windows 代码签名证书。

## 本机构建

使用 Node.js 24、项目 packageManager 指定的 pnpm，运行 `pnpm install --frozen-lockfile`，随后 `pnpm build:desktop`。构建产物位于 build。发布前运行 `node scripts/verify-release.mjs` 检查版本、更新地址及安装包完整性。

## 后续品牌更新

图标、展示页面可独立修改。修改 appId、内部程序名、安装目录或用户数据路径前需要额外设计迁移，避免丢失已有数据。

保留上游 LICENSE 与作者署名，并按其条款分发修改后的源代码。
