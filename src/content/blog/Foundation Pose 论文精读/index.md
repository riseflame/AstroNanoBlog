---
title: "Foundation Pose 论文笔记"
description: "Nvidia yes"
date: "10/10/2026"
---

这篇方法做的是6DoF姿态估计，论文要估计物体相对于相机的 6D 位姿：三个平移自由度和三个旋转自由度。FoundationPose 强调的是 novel objects，即通用位姿网络训练时未见过的新物体。使用时有两种条件：
| 论文中的设置 | 新物体需要提供什么 |
| --- | --- |
| Model-based | 物体的三维 CAD 模型 |
| Model-free | 多视角参考图像；论文实验中使用 RGBD 和对应位姿信息 |

Model-free 的路径也是通过外接一个 Neural Field 的方法将输入的信息建模成带纹理的 CAD 模型后沿着 Model-based 方法实现的。

# 一.方法
文章的整体思路是先生成多个姿态候选，然后不断精炼，我们先看候选生成的部分，如下图所示：
## 1.1 Pose Hypothesis Generation
![image.png](https://img.zzliu.com/file/1791602016818_image.png)
左侧输入的是 RGBD 的图像，按照文章介绍，需要先初始化物体的位姿，位姿包括rotation \(R\)：描述物体朝向，
translation \(t\)：描述物体原点相对于相机原点的位置偏移。
平移就是物体中心点在相机坐标系下的三维坐标，初始状态是水平框检测+框内深度信息中位数获得的。
朝向是通过将物体放在一个二十面体(icosphere)的包裹中，在二十面体的 42 个顶点上初始化视点，每个视点又初始化 12 个不同的旋转方向，共计产生504 个方向候选。这部分对应图中的 **Global pose sampling**。

接着往右侧看：
- 上方 Rendered coarse pose：按照候选位姿渲染的物体 RGBD。
- 下方 Pose conditioned input crop：从相机观测中裁剪出来的 RGBD。

两路 Encoder 共享权重，提取特征后进行拼接，再经过卷积模块和 Transformer。下方的 Pose conditioned input crop 根据当前候选位姿、物体尺寸和相机内参，从当前帧 RGBD 中计算并裁剪得到。第一帧先利用二维检测区域和深度信息初始化平移，再采样生成旋转候选，每个候选分别对应自己的裁剪区域。跟踪时使用上一帧位姿作为初始候选，无需逐帧检测。若执行多次修正迭代，则每次根据更新后的位姿重新计算裁剪区域。
Encoder 后的特征过一个线性层后回归出更新的 rotation 和 translation，更新 504 个候选姿态：
\[
t^{+}=t+\Delta t
\]

\[
R^{+}=\Delta R\,R
\]
根据补充材料，迭代 5 轮。

## 1.2 Pose Selection
在得到精炼的候选后，我们还需要选出得分最高的候选，
![image.png](https://img.zzliu.com/file/1791617696245_image.png)

假设前面留下了 \(K\) 个候选位姿。对候选 \(i\)，准备两份输入：
- Pose conditioned rendering：按照候选位姿渲染物体，表示假如这个姿态正确，相机应该看到什么。
- Pose conditioned input crop：根据该候选，从相机实际拍摄的 RGBD 中裁剪对应区域。
网络要判断：这个候选预测出来的外观和深度，与真实观测有多一致？ 
左侧网络将每一个预测的姿态候选和观察特征融合并调整成需要形式，右侧使用所有的排序一起预测，作者给出的理由是网络同时观察所有预测有助于打分。
下面这个图就是消融掉不同预测做注意力的部分，后预测质量有所下降：
![image.png](https://img.zzliu.com/file/1791801124394_image.png)

## 1.3 CNOS
CNOS: A Strong Baseline for CAD-based Novel Object Segmentation 这是本文使用的零样本的方法 2023 ICCV WorkShop
本文的网络图如下图所示
![image.png](https://img.zzliu.com/file/1791963379181_image.png)
Onbarding stage：同一个零件从正面、侧面、背面看，外观可能差别很大。因此，CNOS 会从多个视角渲染 CAD 模型，得到一组二维图像，也就是 templates，这个和 foundation pose 一样 也是初始化一个二十面体， 将物体放在中心，取 42 个顶点作为视点。
接着，把每张模板送入 DINOv2，用它的 CLS token 作为整张图像的特征向量。

Proposal stage：在真实图像里生成候选区域。
对相机拍到的 RGB 图像，使用 SAM 或 FastSAM 生成一批分割掩码。
然后，对每个候选区域：
- 用掩码去掉背景。
- 裁剪出候选区域，缩放并填充到统一尺寸。
- 同样用 DINOv2 提取 CLS token。

Matching stage：把每个候选区域的特征，与模板库中的特征计算余弦相似度。
因为每个物体有多个视角模板，还需要先把多个模板的匹配分数汇总成一个物体分数，再选择分数最高的物体编号。
最终，每个候选区域得到：
\[
(M_i,\ o_i,\ s_i)
\]
其中 \(M_i\) 是分割掩码，\(o_i\) 是物体编号，\(s_i\) 是匹配分数。掩码覆盖的是物体实际可见的部分，不会补全被遮挡的区域
## 二.实验
## 2.1 Pose tracking

作者说明：跟踪时，把上一帧的位姿用于渲染，再与当前帧比较，通过修正网络得到当前帧位姿。也就是省略掉 Hypothesis 产生的部分，直接预测修正量，省略掉后边的排序和打分环节。

论文在 **第 4.5 节 Running time，第 8 页**报告了实测速度，硬件是 **Intel i9-10980XE + RTX 3090**。

| 模式 | 单个物体的处理时间 | 对应速度 |
| --- | --- | --- |
| 完整位姿估计 | 约 1.3 秒 | 约 0.77 次/秒 |
| Tracking | 约 31 毫秒/帧 | 约 32 帧/秒 |

按这些数据计算，**Tracking 大约快 42 倍**：

$$
\frac{1.3}{1/32} = 41.6
$$

作者还拆分了完整估计的耗时：

- 候选初始化：约 **4 ms**。
- 候选位姿修正：约 **880 ms**。
- 候选打分和选择：约 **420 ms**。

## 2.2 Unseen Object
我比较关注零样本目标的检测效果，4.3 节的实验说明了在 Unseen objects 上的检测效果，AR (average recall) 是符合三种位姿阈值 recall，越高越好。
![image.png](https://img.zzliu.com/file/1791855255690_image.png)

不过这个实验的检测器使用的是 Mask-Rcnn并不是无监督的检测器，所以整体来说并不算是零样本，文章还提供可以通过 CAD 模型来做零样本检测的 CNOS 方法作为检测器。