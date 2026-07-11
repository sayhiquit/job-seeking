# 职配助手

面向求职者和公司招聘方的 Windows 桌面软件原型。当前第一版采用 Tauri + React + SQLite，默认游客模式，本地保存数据。

## 已实现

- 求职者/招聘双身份入口
- 进入后可随时切换身份
- 快速模式/详细模式切换
- 求职者基础画像
- 真实情况补充，仅用于求职策略建议
- 工作风格滑动评估
- 行业与岗位选择
- 岗位 JD 粘贴
- 岗位适配度评分
- 优势、风险与建议解释
- 简历优化文案生成
- 公司端招聘需求分析
- JD 优化建议
- 报告 TXT 导出
- Tauri 命令预留 SQLite 本地保存
- 浏览器环境降级为 localStorage 保存

## 本机运行

当前工作区内已经准备了便携版 Node.js：

```powershell
$env:PATH="$PWD\.tools\node-v24.17.0-win-x64;$env:PATH"
.\.tools\node-v24.17.0-win-x64\npm.cmd run dev -- --host 127.0.0.1
```

如果本机 PowerShell 禁止运行 `npm.ps1`，请优先使用上面的 `npm.cmd` 命令，或运行：

```powershell
npm.cmd run dev
```

访问：

```text
http://127.0.0.1:1420
```

## 构建前端

```powershell
$env:PATH="$PWD\.tools\node-v24.17.0-win-x64;$env:PATH"
.\.tools\node-v24.17.0-win-x64\npm.cmd run build
```

## Tauri 桌面运行

需要完整 Rust stable toolchain 和 Windows C++ 编译工具链。

```powershell
npm run desktop:dev
```

## Tauri 打包

```powershell
npm run desktop:build
```

打包目标配置为 Windows NSIS 安装包。

## 数据保存

桌面环境中，Tauri 后端会把应用状态保存到本地 SQLite：

```text
%LOCALAPPDATA%\JobFitAssistant\jobfit.sqlite
```

浏览器环境中，使用 localStorage 作为降级存储。

导出本地数据时会自动移除 AI API Key，避免迁移、备份或发送文件时泄露密钥。

## 迁移和重新打包建议

如果只是分享源码，不建议把下面这些目录一起压缩：

- `src-tauri/target/`
- `.tools/`
- `node_modules/`
- `.npm-cache/`
- `dist/`
- `release/`

这些目录是本机工具链、依赖缓存或构建产物，会显著放大压缩包体积。需要“开箱即用”的离线包时再保留 `.tools/`、`node_modules/` 和必要的 `release/` 产物。
