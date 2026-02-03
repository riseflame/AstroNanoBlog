---
title: "FisherRF论文解读与复现"
description: "Hit the ground running."
date: "Feb 03 2026"
---
最近有一个项目需要使用机械臂执行检测任务，一直想找个方法来将机械臂和检测检测结合起来，于是经过调研发现了Next Best View（NBV）这个方向，NBV任务算是在3D重建下的一个子任务，旨在使用自动化的方法完成3D重建，于是需要对机械臂等执行机构进行路径规划，不断选择下一个最优视角来最大化每次新增信息对3D重建的贡献。这算是一个比较新的方向，我发现了几篇相关的论文如下：
![image.png](https://img.zzliu.com/file/1770089464941_image.png)


FisherRF算是这个领域的开山之作了，广泛的出现在了后续的相关工作中，本文将对FisherRF进行解读与复现。


