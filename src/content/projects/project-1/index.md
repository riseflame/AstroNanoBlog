---
title: "GPT拼车指南"
description: "各个软件如何使用第三方API的指南"
date: "May 28 2026"
demoURL: "api.zzliu.com"
repoURL: "https://github.com/markhorn-dev/astro-sphere"
---

## 👿 接入CodeX

下载安装CCSwitch，CCSwitch是一个管理各个第三方供应商和全局提示词、Skill的软件，通过CC可以给各个官方软件方便的切换第三方源，下载链接如下：
[我是链接](https://github.com/farion1231/cc-switch/releases)
windows用户下载msi包就可以，**注意：之前安装过的需要更新到最新版本** 安装好后，切换到OpenAI下面，点击右上角添加供应商，如图所示
![image.png](https://img.zzliu.com/file/1780018511140_image.png)
官网链接和API请求地址填写：http://gpt.zzliu.com:8080
API key填自己的 如图所示：
![image.png](https://img.zzliu.com/file/1780018606398_image.png)
填写好后点击管理与测速测试一下连接，然后拉到下面点上启用远程压缩，
![image.png](https://img.zzliu.com/file/1780628702696_image.png)
并把config的开头替换成下面的内容：

```
model_provider = "custom"
model = "gpt-5.5"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.custom]
name = "OpenAI"
wire_api = "responses"
requires_openai_auth = true
base_url = "http://gpt.zzliu.com:8080"
```
点击保存，然后使用这套配置就可以了，Codex需要完全关闭后重启才会生效，之后Codex供应商就被换成了第三方源，如果想切换回去只需要在CCSwitch里切换成官方的就行。

修改全局生效，以后不需要打开CCSwitch也生效。

换成我们的源是不需要梯子就可以使用的，打开Codex选择api登录，api再填一次key，就可以使用了。
## 📋 接入Copilot
首先安装Unify Chat Provider插件，如图所示：

![image.png](https://img.zzliu.com/file/1779948179303_image.png)

插件安装好后使用Ctrl+Shift+P打开命令面板，输入Unify Chat Provider: Import Config，输入如下的供应商配置：

```
eyJ0eXBlIjoib3BlbmFpLXJlc3BvbnNlcyIsIm5hbWUiOiJPcGVuQUkiLCJiYXNlVXJsIjoiaHR0cDovL2dwdC56emxpdS5jb20iLCJhdXRoIjp7Im1ldGhvZCI6ImFwaS1rZXkiLCJsYWJlbCI6IkFQSSBLZXkiLCJkZXNjcmlwdGlvbiI6IuS9v-eUqCBBUEkgS2V5IOi_m-ihjOi6q-S7vemqjOivgSJ9LCJtb2RlbHMiOlt7ImlkIjoiZ3B0LTUuNSIsIm5hbWUiOiJHUFQtNS41IiwibWF4SW5wdXRUb2tlbnMiOjI1NjAwMCwibWF4T3V0cHV0VG9rZW5zIjoxMjgwMDAsInRva2VuaXplciI6Im9wZW5haSIsImNhcGFiaWxpdGllcyI6eyJ0b29sQ2FsbGluZyI6dHJ1ZSwiaW1hZ2VJbnB1dCI6dHJ1ZSwiZWRpdFRvb2xzIjoiYXBwbHktcGF0Y2gifSwic3RyZWFtIjp0cnVlLCJ0aGlua2luZyI6eyJ0eXBlIjoiZW5hYmxlZCIsImVmZm9ydCI6InhoaWdoIn0sInByZXNldFRlbXBsYXRlcyI6W3siaWQiOiJyZWFzb25pbmdFZmZvcnQiLCJuYW1lIjoi5o6o55CG5by65bqmIiwicHJlc2V0cyI6W3siaWQiOiJ4aGlnaCIsIm5hbWUiOiLotoXpq5giLCJkZXNjcmlwdGlvbiI6Iui2hemrmOaOqOeQhua3seW6piIsImNvbmZpZyI6eyJ0aGlua2luZyI6eyJ0eXBlIjoiZW5hYmxlZCIsImVmZm9ydCI6InhoaWdoIn19fSx7ImlkIjoiaGlnaCIsIm5hbWUiOiLpq5giLCJkZXNjcmlwdGlvbiI6IumrmOaOqOeQhua3seW6piIsImNvbmZpZyI6eyJ0aGlua2luZyI6eyJ0eXBlIjoiZW5hYmxlZCIsImVmZm9ydCI6ImhpZ2gifX19LHsiaWQiOiJtZWRpdW0iLCJuYW1lIjoi5LitIiwiZGVzY3JpcHRpb24iOiLlnKjmgJ3ogIPmt7HluqbkuI7pgJ_luqbkuYvpl7Tlj5blvpflubPooaEiLCJjb25maWciOnsidGhpbmtpbmciOnsidHlwZSI6ImVuYWJsZWQiLCJlZmZvcnQiOiJtZWRpdW0ifX19LHsiaWQiOiJsb3ciLCJuYW1lIjoi5L2OIiwiZGVzY3JpcHRpb24iOiLmm7Tlv6vnmoTlk43lupTpgJ_luqblkozmm7TkvY7nmoTmjqjnkIbmt7HluqYiLCJjb25maWciOnsidGhpbmtpbmciOnsidHlwZSI6ImVuYWJsZWQiLCJlZmZvcnQiOiJsb3cifX19LHsiaWQiOiJub25lIiwibmFtZSI6IuaXoCIsImRlc2NyaXB0aW9uIjoi5LiN57uP5o6o55CG55u05o6l5ZON5bqUIiwiY29uZmlnIjp7InRoaW5raW5nIjp7InR5cGUiOiJlbmFibGVkIiwiZWZmb3J0Ijoibm9uZSJ9fX1dLCJkZWZhdWx0IjoieGhpZ2gifV19XSwiYXV0b0ZldGNoT2ZmaWNpYWxNb2RlbHMiOmZhbHNlfQ
```

添加好后，再次输入CTRL+SHIFT+P，输入Unify Chat Provider: Manage Provider，选择OpenAI：
![image.png](https://img.zzliu.com/file/1779948390923_image.png)
接着在配置供应商中选择身份验证，输入自己KEY，保存一下就可以使用了：
![image.png](https://img.zzliu.com/file/1779948489996_image.png)
配置好后可以在copilot的chat窗口中选择GPT-5.5模型了：
![image.png](https://img.zzliu.com/file/1780628929096_image.png)
如果需要使用其他模型可以在供应商窗口中获取官方模型列表，然后自己配置，需要修改一下上下文窗口大小，因为拉取到的是官方API版本的上下文，和我们用订阅账号反代出来的上下文窗口大小不一致。这个GPT-5.5是我修改好的，直接使用就可以了，后续如果反代出来pro模型，我会再更新一下这个配置的。

还有一个需要改动的地方是Copilot的subagent，默认是调用官方的免费模型，性能很差，我们需要用prompt的方式来让他调用我们的模型，这里我推荐全局自定义Agent的方案，修改一次之后在这台电脑上的vscode都生效，如下图所示，使用时调用自定义的agent即可：
![image.png](https://img.zzliu.com/file/1780629167665_image.png)
我本地的提示词地址是,不同人可能不一样，直接让ai去给你配一下
```
C:\Users\Administrator\AppData\Roaming\Code\User\prompts\
```

主要是在全局提示词中加入：

```
When invoking a subagent, always specify the model explicitly
- model: `GPT-5.5 (unify-chat-provider)`
Do not rely on the default subagent model when delegating exploration work. If that model is unavailable, report the unavailable-model error and ask before falling back.
```

配置好后插件应该可以识别这个新的agent，我们最好在把这个agent需要使用的工具权限给他开下，这样他就可以调用了，勾选需要的即可，省事也可以直接全勾，如下图所示：

![image.png](https://img.zzliu.com/file/1780629360769_image.png)