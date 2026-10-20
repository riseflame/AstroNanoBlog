---
title: "6DoF 估计论文阅读笔记"
description: "I hit the spotlight all night, ready to go"
date: "10/10/2026"
---

# 一. FoundationPose

这篇方法做的是6DoF姿态估计，论文要估计物体相对于相机的 6D 位姿：三个平移自由度和三个旋转自由度。FoundationPose 强调的是 novel objects，即通用位姿网络训练时未见过的新物体。使用时有两种条件：
| 论文中的设置 | 新物体需要提供什么 |
| --- | --- |
| Model-based | 物体的三维 CAD 模型 |
| Model-free | 多视角参考图像；论文实验中使用 RGBD 和对应位姿信息 |

Model-free 的路径也是通过外接一个 Neural Field 的方法将输入的信息建模成带纹理的 CAD 模型后沿着 Model-based 方法实现的。

## 1.1 方法

文章的整体思路是先生成多个姿态候选，然后不断精炼，我们先看候选生成的部分，如下图所示：
### 1.1.1 Pose Hypothesis Generation
![image.png](https://img.zzliu.com/file/1791602016818_image.png)
左侧输入的是 RGBD 的图像，按照文章介绍，需要先初始化物体的位姿，位姿包括rotation $R$：描述物体朝向，
translation $t$：描述物体原点相对于相机原点的位置偏移。
平移就是物体中心点在相机坐标系下的三维坐标，初始状态是水平框检测+框内深度信息中位数获得的。
朝向是通过将物体放在一个二十面体(icosphere)的包裹中，在二十面体的 42 个顶点上初始化视点，每个视点又初始化 12 个不同的旋转方向，共计产生504 个方向候选。这部分对应图中的 **Global pose sampling**。

接着往右侧看：
- 上方 Rendered coarse pose：按照候选位姿渲染的物体 RGBD。
- 下方 Pose conditioned input crop：从相机观测中裁剪出来的 RGBD。

两路 Encoder 共享权重，提取特征后进行拼接，再经过卷积模块和 Transformer。下方的 Pose conditioned input crop 根据当前候选位姿、物体尺寸和相机内参，从当前帧 RGBD 中计算并裁剪得到。第一帧先利用二维检测区域和深度信息初始化平移，再采样生成旋转候选，每个候选分别对应自己的裁剪区域。跟踪时使用上一帧位姿作为初始候选，无需逐帧检测。若执行多次修正迭代，则每次根据更新后的位姿重新计算裁剪区域。
Encoder 后的特征过一个线性层后回归出更新的 rotation 和 translation，更新 504 个候选姿态：

$$
t^{+}=t+\Delta t
$$

$$
R^{+}=\Delta R\,R
$$

根据补充材料，迭代 5 轮。

### 1.1.2 Pose Selection
在得到精炼的候选后，我们还需要选出得分最高的候选，
![image.png](https://img.zzliu.com/file/1791617696245_image.png)

假设前面留下了 $K$ 个候选位姿。对候选 $i$，准备两份输入：
- Pose conditioned rendering：按照候选位姿渲染物体，表示假如这个姿态正确，相机应该看到什么。
- Pose conditioned input crop：根据该候选，从相机实际拍摄的 RGBD 中裁剪对应区域。
网络要判断：这个候选预测出来的外观和深度，与真实观测有多一致？ 
左侧网络将每一个预测的姿态候选和观察特征融合并调整成需要形式，右侧使用所有的排序一起预测，作者给出的理由是网络同时观察所有预测有助于打分。
下面这个图就是消融掉不同预测做注意力的部分，后预测质量有所下降：
![image.png](https://img.zzliu.com/file/1791801124394_image.png)

### 1.1.3 CNOS
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

$$
(M_i,\ o_i,\ s_i)
$$

其中 $M_i$ 是分割掩码，$o_i$ 是物体编号，$s_i$ 是匹配分数。掩码覆盖的是物体实际可见的部分，不会补全被遮挡的区域

## 1.2 实验

### 1.2.1 Pose tracking

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

### 1.2.2 Unseen Object
我比较关注零样本目标的检测效果，4.3 节的实验说明了在 Unseen objects 上的检测效果，AR (average recall) 是符合三种位姿阈值 recall，越高越好。
![image.png](https://img.zzliu.com/file/1791855255690_image.png)

不过这个实验的检测器使用的是 Mask-Rcnn并不是无监督的检测器，所以整体来说并不算是零样本，文章还提供可以通过 CAD 模型来做零样本检测的 CNOS 方法作为检测器。

# 二. RACE-6D: Real-time Accurate Coarse-to-finE object 6D Pose Transform
与 foundation pose 的 track 依赖于上一帧的检测结果不同，本文是独立的对每一帧图像进行姿态估计，文章主打的卖点就是实时性，在 3090 上可以跑到八十多FPS。这篇文章发表在 2026 的 cvpr finding 上边。
## 2.1 方法
文章整体分为两个阶段，coarse stage 和 refine stage。网络图如下图所示：
![image.png](https://img.zzliu.com/file/1792394693781_image.png)
它分为四步：
1. 提取整张图的特征。 Backbone 和 Encoder 生成多尺度特征，供检测、关键点和位姿预测共同使用。
2. 产生粗略预测。 多个预测头分别输出类别、二维框、平移、关键点和旋转。
3. 选择候选对象。 根据分类分数选出前 \(N\) 个 query。这里可以把 query 理解为一个候选物体对应的特征向量。
4. 细化预测。 Decoder 重新读取相关图像特征，逐层修正粗略结果。
很多方法先检测物体，再针对每个物体裁剪图像、运行位姿网络或几何求解器。物体数量增加时，这些处理会反复执行。

### 2.1.1 Coarse Stage
首先看 coarse stage 这里通过 backbone encoder 提取出特征后 直接并行的送入分类，目标检测，预测 Translation，和预测关键点的各个 head 当中以保证速度。


这些关键点来自物体三维包围盒及其边上的插值点，共 32 个。网络预测的是它们投影到图像中的位置。 旋转矩阵预测和关键点预测是串行的，这里对特征中的所有位置都预测关键点，然后 concat 到一起送入旋转 head 中。
![image.png](https://img.zzliu.com/file/1792396343905_image.png)

为什么有帮助？以一个盒子为例，包围盒各角点在图像中的相对位置，包含了朝向信息：哪个面更宽、哪条边倾斜、哪些角点靠得更近，都与三维旋转有关。

并且文章中的关键点预测都并不是直接预测坐标，而是预测一个 0-1 的比例，表示在 boundingbox 内部的位置，这样做的好处是降低了物体远近变化给学习带来的难度，可以让预测忽略大小。

对 translation 也采用同样的设置，rx，ry 都是百分数。

### 2.1.2 Query Selection
展平后的特征尺寸为[S, C]，\(S\) 是所有特征位置的数量，\(C\) 是每个位置的特征维度。
1. \(S\) 是所有特征位置的数量，\(C\) 是每个位置的特征维度。分类头会为每个位置预测各物体类别的分数：
默认选择方式是：每个位置取最高类别分数，再按这个分数排序。

2. 保留分数最高的 N 个位置

3. 把选中的特征和粗预测一起交给 Decoder
对于每个选中的候选，保留：
- 对应位置的特征，作为 object query 的初始内容；
- 粗预测的物体框、关键点、旋转和平移，作为后续细化的参考值。

### 2.1.3 Refine Stage
这里会经过多次 Refine 每一层内的结构是：
``` python
Object queries
      ↓ Self-attention
候选之间交换信息
      ↓ Deformable cross-attention
根据当前框，从整图特征中读取相关信息
      ↓ FFN
进一步处理特征
      ↓ 各个预测头

```
self-attention 用来交换各个 query 内部的信息，帮助消除重复预测，最后的结果更新 query。
接着是 Deformable cross-attention：重新从图像中获取证据。Query Selection 选出来的 query 只是一个特征向量。为了修正结果，它需要继续读取图像特征。
这里使用当前预测框作为参考，由 query 预测采样位置和权重，在多尺度特征图上读取少量位置，再汇总到 query 中。
然后根据 refine 后的 query 重新进入预测头，预测各个参数，后继续进行 refine。总计会 refine 3 次。

这里对于深度的 refine 是特殊的，如下图所是，每层 decoer 会输出 33 个调整档位，然后会用一个小型的 mlp 对每个调整档位打分，最后算出的加权调整深度才会被加到现有的深度上。
![image.png](https://img.zzliu.com/file/1792397189129_image.png)
