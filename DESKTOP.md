# 职配助手桌面端

这是 Tauri + React + SQLite 的 Windows 桌面端原型。

## 开发运行

双击或在 PowerShell 运行：

```bat
desktop-dev.cmd
```

等 Tauri 编译完成后会打开桌面窗口。

## 打包安装包

双击或在 PowerShell 运行：

```bat
package-desktop.cmd
```

打包产物通常在：

```text
release
```

如果提示缺少 `link.exe`，说明本机还没有安装 Windows C++ 编译工具。安装 `Visual Studio Build Tools 2026/2022`，并勾选 `Desktop development with C++` 后，再重新运行 `package-desktop.cmd`。

## AI 配置

进入应用后点击右上角齿轮：

- API Key：填写 OpenAI 或兼容服务商的 Key
- Base URL：默认 `https://api.openai.com/v1`
- 模型：默认 `gpt-4.1-mini`
- 隐私授权：AI 分析会把岗位、简历、性格问卷和真实情况发送给你配置的 AI 服务商，必须在设置中勾选授权后才会请求。

桌面端已接通 OpenAI-compatible `/chat/completions` 请求。默认 OpenAI 地址会请求 `https://api.openai.com/v1/chat/completions`；第三方服务商请填写它提供的兼容 Base URL。

## 本地数据

用户填写内容和最近分析记录会保存到 SQLite，本机路径在 Windows 用户数据目录下：

```text
%LOCALAPPDATA%\JobFitAssistant\jobfit.sqlite
```

数据库当前包含：

- `app_state`：保存当前填写状态和设置
- `analysis_records`：保存最近 50 条求职/招聘分析记录

## 当前原型能力

- 求职端：角色选择、粗略/详细选择、逐题 QA、未保存提醒、不完整分析提醒、本地结构化分析、真实 AI 分析、隐私授权、个人展示、历史记录、报告导出。
- 招聘端：岗位信息、JD、硬性门槛、候选人风险点、公司卖点、检索关键词、人才画像、面试追问、JD 优化。
- 知识库：已扩展常见岗位能力模型和城市机会库，用于判断更适合做什么岗位、哪些城市更匹配。

## 编译环境说明

项目自带了 Node 和 Rust 工具链路径脚本。首次运行桌面端时，Cargo 可能需要下载 Rust 依赖包；如果网络访问 crates.io 或 static.rust-lang.org 超时，需要先让 Rust/Cargo 依赖下载成功后再运行。
