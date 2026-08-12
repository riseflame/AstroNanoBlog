---
title: "在轨加注接口调研"
description: "空间卫星在轨加注方案"
date: "08/12/2026"
---


# 一. Orbitfab方案

Orbitfab是一个美国的在轨加注公司，提供了一个标准的在轨加注接口RAFTI，主要用于液体推进剂的在轨加注。目前该公司已向美国太空军交付了多个在轨加注接口，预计在2026年至2027年期间执行Tetra-5和Tetra-6任务。RAFTI为商业接口标准，部分设计在该公司官网公开。

加注接口尺寸如下图所示：
![image.png](https://img.zzliu.com/file/1786518397140_image.png)

RAFTI官方演示视频如下：
<video controls style="width:100%">
  <source
    src="https://img.zzliu.com/file/1786516032326_YouTube_RAFTI_User_Guide_Out_Now_n2daS5ggwmU.mp4"
    type="video/mp4"
  />
</video>

下图展示了RAFTI的接口设计方案，中间是加注接口，已加注接口为中心的的直径为520mm的区域设计为净空区，不要出现其他物体。半径100mm的区域安装4个ArUco标记，用于视觉识别，用户指南中也明确要求ArUco标记需具有热反射涂层，提供30 m 距离远红外光可探测性，以及标记安装位置需达到 0.1 mm / 0.1° 的测量精度。
![image.png](https://img.zzliu.com/file/1786519704733_image.png)


# 二. 三垣航天方案


<video controls style="width:100%">
  <source
    src="https://img.zzliu.com/file/1786521840893_cctv_segment_0.mp4"
    type="video/mp4"
  />
</video>



如下图所示，三垣航天采用手在眼上方案，机械臂末端上方安装摄像头，加注口上方固定了一个视觉引导板，看图案类似于WhyCon圆环，应该是相机对准某一个位置时，下方的加注口也会对齐接口。
![image.png](https://img.zzliu.com/file/1786520670432_image.png)