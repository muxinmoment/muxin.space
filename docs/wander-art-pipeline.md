# Wander Room 高分辨率美术流水线

> 版本：v1.0
> 状态：实施约定
> 来源：Agent Sprite Forge 的资产契约、Parallax Background Generation 的分层思路、Pixelorama 的图层编辑能力

## 1. 目标

`/wander/` 的美术原型必须先达到完整的 `1920×1080` 画面，再拆分成运行时图层。不能先画低分辨率色块，再把放大后的尺寸当作画质。

运行时图层统一使用 `2048×1152` 16:9 WebP，主视觉原型统一使用 `1920×1080`。

## 2. 资产契约

### 2.1 主视觉原型

主视觉原型是完整合成图，只用于构图、光影和视觉回归，不直接作为交互运行时背景。

```text
public/wander/prototype-dusk-1920.webp
```

原型必须包含：

- 窗外远景、中景建筑和室内窗框；
- 房间墙面、地板、家具和前景遮挡；
- 四个内容区域的可识别物件；
- 主要光源、投影和受光边；
- 不少于一个能表达生活感的小物件群。

### 2.2 运行时图层

每个时间状态必须提供同名的六层资产：

```text
public/wander/<scene>/
├── sky.webp
├── outside.webp
├── room.webp
├── objects.webp
├── light.webp
├── foreground.webp
└── scene.prompt.txt 或 scene.source.json
```

| 层 | 允许内容 | 禁止内容 |
| --- | --- | --- |
| `sky` | 天空、云、太阳、月亮 | 室内家具、文字、热点 |
| `outside` | 城市、远山、树影、街灯 | 可点击室内物件 |
| `room` | 墙、窗框、地板、固定结构 | 书架内容、桌面杂物 |
| `objects` | 书架、照片墙、书桌、收音机 | UI、热点标签、页面文字 |
| `light` | 窗光、灯光、反射、尘埃 | 不透明背景、主体轮廓 |
| `foreground` | 椅背、植物、桌沿、散落物件 | 覆盖全部热点的遮挡 |

运行时图层必须保持透明通道，不能把六层重新合成后作为唯一交互资产。

### 2.3 对象和热点

视觉对象与交互对象分离：

- 图片负责物件外观；
- DOM/SVG 按钮负责可访问交互；
- TypeScript 负责镜头、进度和小游戏；
- 不通过图片像素坐标推断点击结果；
- 每个热点必须有稳定的 `data-room-camera` 和可读名称。

## 3. 工具分工

### Agent Sprite Forge

借鉴其 `generate2dmap` 的分层契约和 `generate2dsprite` 的资产 QA 思路：

- 先生成/绘制主视觉参考；
- 再拆分基础层、物件层和前景层；
- 为每个资产保存来源、尺寸、调色板和处理记录；
- 对运行时资源做尺寸、透明度、边界和命名检查。

当前环境没有可调用的内置图像生成器，因此不执行它依赖的图像生成步骤；程序绘制只作为原型和处理工具，不冒充最终插画来源。

### Parallax Background Generation

只吸收以下方法，不直接复制其未明确授权的代码：

- 远景/中景/近景分离；
- 统一画布、地平线和锚点；
- 限定色板和像素化输出；
- 视差层独立导出；
- 合成预览与尺寸验证。

该仓库没有发现明确许可证，不得将其源代码并入项目。

### Pixelorama

作为高质量原型的可编辑工具约定：

- 主视觉优先在 `1920×1080` 画布上完成；
- 使用独立图层对应 `sky/outside/room/objects/light/foreground`；
- 使用固定调色板和像素对齐工具；
- 导出运行时 WebP 前保留原始工程文件；
- Pixelorama 源码和工程目录放在工作区工具目录，不复制进博客仓库。

Pixelorama 当前没有独立的图片导出 CLI，但仓库自己的 CI 已验证 Godot headless
导入和项目导出路径：

```bash
godot --headless --path tools/Pixelorama --import
godot --headless --path tools/Pixelorama --export-release "Linux 64-bit" <output>
```

这条命令导出的是 Pixelorama 应用本身，不等于自动打开一个 `.pxo` 并导出 WebP。
要实现 Wander 的批处理，需要在 Pixelorama 工程中增加一个只负责加载工程、合成指定图层、
导出 PNG/WebP 的 Godot automation entrypoint；运行时使用 Godot 4.6.3 headless，
不依赖桌面显示器。当前服务器尚未安装 Godot，因此这条链路保留为下一步实验，不把 GUI
可用性误认为自动化能力。

## 4. 来源记录

每个被接受的主视觉或图层必须附带来源记录：

```json
{
  "canvas": "1920x1080",
  "runtimeSize": "2048x1152",
  "scene": "dusk",
  "source": "pixelorama|image-generation|procedural-prototype|existing-art",
  "palette": ["#1d2038", "#51466b", "#e17b58", "#ffb45f"],
  "layers": ["sky", "outside", "room", "objects", "light", "foreground"],
  "review": "pending|accepted|rejected"
}
```

如果使用图像生成，必须保存手写 prompt；如果使用 Pixelorama，必须记录工程文件路径和导出版本；如果使用程序原型，必须明确标记为 `procedural-prototype`。

## 5. QA 门槛

资产进入页面前必须通过：

1. 文件数量和命名检查；
2. 每张图尺寸检查；
3. RGBA 通道检查；
4. 四个时间状态图层完整性检查；
5. 合成预览检查；
6. 浏览器真实加载检查；
7. 桌面端和移动端截图回归。

任何一项失败都不能把该轮称为完成。当前项目使用：

```bash
python3 scripts/validate-wander-assets.py
```
