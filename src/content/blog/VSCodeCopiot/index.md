---
title: "VSCode Copilot 备忘录"
description: "性价比真高啊"
date: "17/3/2026"
draft: false
---

<center>此文章未经过AI编写和润色，请放心阅读。</center>

Github Copilot是微软公司推出的一款编程助手，可以自动完成代码编写、创建文件、执行命令等功能，相较于Cursor、ClaudeCode、CodeX、Trae等类似的产品Copilot具有以下几点优势：


1. 独特的按请求次数的收费模式，每条请求无论消耗多少Token都收取相同费用。
2. 提供世界上最新的、性能最优秀的模型。
3. VSCode，Visual Studio Code原生支持，编程体验更好。
# 一 收费模式
Copilot提供独特的按请求计费的收费模式，也就是用户的每次对话计算一次请求，这种收费模式在价格和直观程度上全面优于按Token计费，借助一些prompt设计小技巧，我们可以将多个任务压缩在一次对话上，以达到“Claude Opus 4.6干了快一整天的活，还只消耗了一次的额度”。如果在按Token的计费模式下，这样高强度的使用早就达到订阅内容的上限或者Token账单爆炸了。

每次请求根据所选的模型不同，消耗的次数也不同，比如如果选择参数量较小的Claude Haiku 4.5，只消耗0.33倍次数，而具有庞大参数量的Claude Opus 4.6每次请求则消耗3倍次数。

![image.png](https://img.zzliu.com/file/1773735267704_image.png)

Copilot 提供三种个人用户的套餐，免费用户可以访问0.33倍和0倍的模型，这些模型对于免费用户消耗1倍次数，每个月只有50次请求。10USD的PRO包含每个月300次请求次数，当PRO用户使用了300次请求后，可以继续以0.04 USD每次的价格继续使用。

![image.png](https://img.zzliu.com/file/1773735293706_image.png)

# 二 使用小技巧
## 2.1 Subagent

Subagent是让模型自己创建一个新的会话，在会话中为Subagent去自动安排角色和任务，通过这种形式，可以提高模型的输出质量，调用该功能只需要在提示词里写好调用几个subagent去做xxxxx。常用的例子就是去讨论实现，和review代码，如下所示：

![image.png](https://img.zzliu.com/file/1773735381119_image.png)

## 2.2 MCP工具配置
MCP是可以给模型调用的API接口，通过MCP模型可以调用其他程序获取信息，比如如果需要Copilot获取实时的天气数据，Copilot只会去网上搜索信息，但网上搜索的结果不一定准确，就有可能会返回给我们错误的数据。如果我们找到天气预报的API接口，并将它通过MCP封装起来，模型就会调用该API接口，返回准确的数据。下面我以一个格式转换工具为例子，介绍如何在VSCode的Copilot中配置MCP。
Copilot并不支持上传Word，PDF等文档类文件，我们可以安装一个将文档转换成可以阅读的文件的工具，并通过MCP开放给模型使用。这里我是用MarkItDown这个软件，他支持将文档转换为MarkDown文件，并且官方支持了MCP，仓库如下所示：

![image.png](https://img.zzliu.com/file/1773735528012_image.png)

按照官方给定的安装教程，安装这个软件：
``` bash
pip install markitdown-mcp
```
在想使用该MCP的项目下建立vscode文件夹和mcp.json文件
![image.png](https://img.zzliu.com/file/1773735592837_image.png)

``` json
json文件中声明该工具
{
  "servers": {
    "markitdown": {
      "type": "stdio",
      "command": "/home/lzz/.conda/envs/analysis/bin/markitdown-mcp"
    }
  }
}
``` 

配置好后，我们通过vscode的左边栏的插件窗口中，可以管理我们的MCP服务：

![image.png](https://img.zzliu.com/file/1773736039957_image.png)

完成配置后，直接告诉模型指令就可以，模型会自动的调用MCP服务完成格式转换，结果如下图所示：

![image.png](https://img.zzliu.com/file/1773736073399_image.png)

## 2.3 SKILL

SKILL是一种各个Agent提供商提供的一种通用的技能描述格式，SKILL是一个文件夹，其中包含描述该SKILL的md文件，该SKILL需要使用的脚本，以及其他资源文件。通过SKILL，我们可以搭建自己的工作流，在markdown文件中写好先做什么，去调用那些工具，参考那些资料，最后输出什么结果。
在VSCode中写Agent SKILL的用法和各项设定官方文档中已经写的很清楚了，可以参考[官方文档](https://code.visualstudio.com/docs/copilot/customization/agent-skills)，这里我就不赘述了。
简述一下使用时的一些注意事项，创建时通过CTRL+SHIFT+P的Open Customizations可以创建Instruction，SKILL等模型的设置文件：
![image.png](https://img.zzliu.com/file/1773738288610_image.png)
创建SKILL后，VSCODE会在工作区创建一个.github文件夹，文件夹下创建skill的文件夹，skill的文件夹就在这个文件夹下，SKILL的文件夹结构如下所示：
![image.png](https://img.zzliu.com/file/1773738512139_image.png)
SKILL.md中存放该SKILL的具体描述，开头是一段yaml，里面各个字段的意思可以在官网找到
![image.png](https://img.zzliu.com/file/1773738636456_image.png)
md的文件如下所示：
![image.png](https://img.zzliu.com/file/1773738682791_image.png)
建立好SKILL后，我们就可以直接和用斜杠命令相同的方法去调用skill，skill的名字和文件夹的名字是一致的。skill还有一些有趣的设定，比如skill可以自动触发，模型会读取每个skill的description字段，如果模型觉得当前的任务和某个skill的description相关度较高，就会自动触发该skill，去调用该skill中定义的工具来完成任务。当然也可以设置某个skill不允许自动触发，或者不允许手动触发。