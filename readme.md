# HiWork

HiWork 是一个面向个人与企业团队的 AI Agent 工作台，用统一界面连接 AI Agent、模型、企业知识和可复用工作流。项目同时提供桌面端与 WebUI，并支持运行时品牌配置、企业身份接入、权限边界和容器化部署，企业接入时不需要长期维护独立的 UI 分支。

## 核心能力

- 在一个工作台中管理内置与外部 AI Agent
- 支持 Codex、Claude Code 等外部 Agent 运行时
- 支持自定义品牌名称、Logo 和登录方式
- 提供 OIDC、SAML 企业登录入口配置
- 支持组织、角色和权限声明，并默认拒绝未知权限
- 提供审计事件与密钥引用契约，避免敏感值进入前端配置
- 保留本地账号密码登录作为可选备用方式
- 支持桌面端、远程 WebUI、定时任务、Skills、MCP 与多 Agent 团队
- 提供 Docker 和 Kubernetes 企业部署示例
- 响应式界面，内置 13 套语言包

## 快速开始

开发环境需要 Bun 1.3+、Node.js 22-24，以及 Electron 原生依赖所需的平台构建工具。

```bash
bun install --frozen-lockfile
bun start
```

构建桌面应用：

```bash
bun run package
```

启动 WebUI：

```bash
bun run webui
```

生产模式 WebUI：

```bash
bun run webui:prod
```

## 企业登录配置

部署时替换 `public/enterprise-config.json`，即可配置企业品牌和身份提供方：

```json
{
  "brandName": "HiWork",
  "logoUrl": "/branding/company-logo.png",
  "passwordLoginEnabled": false,
  "authProviders": [
    {
      "id": "workforce-oidc",
      "protocol": "oidc",
      "label": "企业 SSO",
      "loginUrl": "/api/auth/oidc/start"
    }
  ]
}
```

登录入口只负责跳转。OIDC/SAML 回调校验、用户映射、组织成员关系和 HttpOnly Session 必须由后端或企业身份网关实现。客户端密钥、签名密钥、刷新令牌和 SAML 私钥不得写入浏览器配置。

详细说明：

- [企业身份接入](./docs/guides/enterprise-access.md)
- [企业安全边界](./docs/guides/enterprise-security.md)
- [Kubernetes 部署示例](./deploy/kubernetes/enterprise-workspace.yaml)

## 权限与安全

前端权限判断只用于控制界面展示，不能作为安全边界。每个受保护的后端接口都必须独立校验：

- 当前登录用户
- 所属组织
- 角色与权限
- 请求资源的组织归属
- 操作对应的资源范围

生产环境应启用 HTTPS，并通过 Secret 管理 API Key、OIDC Client Secret、签名密钥和证书。不要把任何密钥直接写入镜像、ConfigMap 或 `enterprise-config.json`。

## 测试与校验

```bash
bunx tsc --noEmit
node scripts/check-i18n.js
bun run test
bun run package
```

## 项目结构

```text
packages/desktop/     Electron 桌面端与 WebUI
packages/web-host/    Web 服务宿主
packages/web-cli/     WebUI 命令行入口
public/               运行时公开配置与静态资源
deploy/kubernetes/    Kubernetes 部署示例
docs/guides/          使用与企业接入文档
tests/                单元、集成与端到端测试
```

## 兼容说明

为兼容旧版本的数据迁移、环境变量和外部集成，部分内部兼容标识仍可能沿用旧格式；这些标识不代表 HiWork 的对外品牌。
