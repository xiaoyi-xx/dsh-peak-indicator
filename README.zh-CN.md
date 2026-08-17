# dsh-peak-indicator

[English](README.md) | 中文

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI 的高峰时段指示灯。在会话头部右上角（原生 `conversation.session.header.utilities` 工具位）显示一个融入界面的小胶囊，实时告诉你当前**北京时间**是否处于 DeepSeek API 的**高峰时段**，带秒级时钟、下一转折倒计时和价格提示。

![peak indicator](assets/peak-indicator.png)

> 截图占位——把实际截图放到 `assets/peak-indicator.png` 再推送。

## 功能

DeepSeek 官方峰谷定价于 **2026-08-17** 生效：

| 状态 | 北京时间（每日） | 价格 |
| :-- | :-- | :-- |
| 🔴 **高峰** | 09:00–12:00 和 14:00–18:00 | 高峰价（= 空闲 ×2） |
| 🟢 **空闲** | 其余时间 | 高峰的一半 |

胶囊显示内容：

- 状态圆点——**红 = 高峰，绿 = 空闲**
- 实时北京时钟（`HH:MM:SS`，时区 `Asia/Shanghai`，与本机时区无关）
- 倒计时：`剩 3h 54m · 价格 ×2`（高峰）/ `距高峰 3h 54m · 半价`（空闲）
- 点击展开下拉详情：高峰窗口、下一转折（含 `HH:MM:SS` 倒计时）、当前阶段进度条、价格说明

全部使用 Web UI 原生 `--dsw-alias-*` 主题变量，与界面完全融合，没有悬浮贴片。

## 安装

插件是经 profile 补丁层挂载的真实包，**重启 dsh web 不会消失**。

### dsh CLI 安装（发布到 npm 后）

```sh
dsh plugin --profile web add dsh-peak-indicator
```

### 手动 / 源码安装

1. 把 `dsh-peak-indicator` 目录复制（或链接）进 profile 的 `node_modules`：

   ```sh
   # 在仓库根目录执行
   cp -R . "$HOME/.dsh/profiles/web/node_modules/dsh-peak-indicator"
   ```

2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 里加一行插入：

   ```yaml
   - insert:
       - id: dsh-peak-indicator
         name: 'dsh-peak-indicator'
   ```

3. 刷新页面（补丁文件有监听、支持热加载）；没出现就重启一次 `dsh web`。

## 构建

发布的 `lib/` 由 `src/` 生成：

```sh
npm run build     # 把 src/*.js 复制到 lib/
npm run check     # 两个半区的语法检查
npm test          # 高峰判定算法边界测试
```

`npm publish` 会自动执行 `prepack`（构建）。

## 高峰时段策略

高峰窗口硬编码在 `src/client.js` 的 `BOUNDS = [540, 720, 840, 1080]`（一天中的分钟：09:00、12:00、14:00、18:00）。如果 DeepSeek 以后调整时段，改这一个常量重新构建即可；也可以在本仓库提 Issue/PR，社区插件列表（[awesome-dsh-plugin](https://awesome-dsh-plugin.com)）会自动收录。

## 目录结构

```
dsh-peak-indicator/
├── src/             # 源码（宿主半区 + 浏览器半区）
├── lib/             # 构建产物（已提交，零门槛安装）
├── scripts/         # 构建与测试脚本
├── cordis.patch.yml # dsh plugin add 使用的 bundle 补丁
└── package.json     # dsh.bundle / dsh.client 声明
```

## 发布

```sh
npm publish          # prepack 会自动构建 lib/
```

之后 `dsh plugin --profile web add dsh-peak-indicator` 即可安装已发布版本。

## 许可证

[MIT](LICENSE)
