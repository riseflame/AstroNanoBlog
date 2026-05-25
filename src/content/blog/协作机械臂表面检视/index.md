---
title: "协作机械臂表面检视"
description: "🚧基于Elite CS63机械臂的自动化表面检视项目"
date: "05/09/2026"
---

# Rviz仿真场景搭建
## 机械臂部件定义
如图所示，机械臂基座上负责控制整体旋转的关节为base，接下来按照人类手臂命名，第一个可动关节是肩部，第二个是肘部，接下来是腕部1，腕部2.... 以及最终的工具法兰。
![image.png](https://img.zzliu.com/file/1778662521240_image.png)
我们使用的CS63各个部件的定义如下图所示：
![image.png](https://img.zzliu.com/file/1779343511500_image.png)
## 底座建模
我们需要在规划时加入桌面的模型，防止机械臂规划一条会和桌面发生碰撞的路径，底座上有四个把手，为了防止机械臂会撞到把手，我将安全平面和规划的底座都拉高了1CM，这样会导致机械臂的基座与肘部有一些穿模，还需要在碰撞检测中把这两部分和底座的碰撞屏蔽掉。
首先是在rviz里面显示底座：在 model_visualizer.py里，_publish_table() 会发布一个 visualization_msgs/Marker：

``` python
m.type = Marker.CUBE
m.header.frame_id = 'base_link'
m.scale.x = table_size_x
m.scale.y = table_size_y
m.scale.z = table_thickness
m.pose.position.z = table_surface_z - table_thickness * 0.5
```
这个 marker 发布到：/table_marker 然后 minimal.rviz 里添加了一个 Marker 显示项，订阅 /table_marker，所以 RViz 能看到红色桌面。
![image.png](https://img.zzliu.com/file/1778663532114_image.png)

然后是Movit的碰撞检测：在inspection_planner.py里，_publish_collision_scene() 会持续向 /planning_scene 发布 PlanningScene。

桌面碰撞物体在 _make_table_collision_object() 里创建：

``` python
table = CollisionObject()
table.header.frame_id = 'base_link'
table.id = 'inspection_table'

table_box = SolidPrimitive()
table_box.type = SolidPrimitive.BOX
table_box.dimensions = [table_size_x, table_size_y, table_thickness]
```

它的位置和 RViz 桌面一致：

``` python
table_pose.position.x = table_center_x
table_pose.position.y = table_center_y
table_pose.position.z = table_surface_z - table_thickness * 0.5
```

这样 MoveIt 规划时就知道桌面存在，会避免轨迹穿过桌面。
桌面直接在基座附近，会和机械臂底座模型重叠。为避免起始状态报碰撞，我没有切开桌子，而是设置 Allowed Collision Matrix。
在 params.yaml 里允许这些 link 和桌面碰撞：
``` yaml
table_allowed_collision_links: ["base_link", "base_link_inertia", "shoulder_link"]
```
代码里会先调用 /get_planning_scene 读取 MoveIt 当前 ACM，再追加：
- inspection_table \<-> base_link
- inspection_table \<-> base_link_inertia
- inspection_table \<-> shoulder_link

# 机械臂描述文件编写
艾利特的ROS2包中并不是单独的URDF描述文件，而是通过XACRO文件生成URDF描述文件的，XACRO文件中包含了机械臂的结构信息、关节限制、传感器信息等内容。对于该项目应该将连接件和摄像头加入到urdf的描述中，同时更新机械臂的碰撞检测信息。

## URDF(Unified Robot Description Format)



cs.urdf.xacro 作为入口文件，经过 xacro 命令展开后，生成最终的 URDF 字符串给 robot_state_publisher / MoveIt 使用。

cs_macro.xacro是urdf的下一层，会读取mesh中的模型文件和yaml里面的配置参数。
具体调用结构如下：
```
launch.py
  -> xacro cs.urdf.xacro
      -> include cs_macro.xacro
          -> include inc/cs_common.xacro
          -> include inc/cs_transmissions.xacro
          -> include cs.ros2_control.xacro
      -> 读取 config/cs63/*.yaml
      -> 读取 meshes/cs63/*
      -> 生成最终 URDF
```
增加连接件和摄像头需要在macro这一层加入新的link和joint，link代表机械臂的一个刚体部件，joint则是代表两个link间的关系。
对于我们新加入的连接件和摄像头，都需要定义一个link来描述它们的几何形状和物理属性，同时需要定义joint将连接件连接到机械臂末端，以及将摄像头连接到连接件上。具体代码如下：

```
<!-- Custom connector mounted after the default tool frame. -->
    <link name="${tf_prefix}connector_link">
      <visual>
        <origin xyz="0 0 0" rpy="0 0 0"/>
        <geometry>
          <mesh filename="package://eli_cs_robot_description/meshes/cs63/custom/connector.stl" scale="0.001 0.001 0.001"/>
        </geometry>
        <material name="connector_gray">
          <color rgba="0.45 0.45 0.45 1.0"/>
        </material>
      </visual>
      <collision>
        <origin xyz="0 0 0" rpy="0 0 0"/>
        <geometry>
          <mesh filename="package://eli_cs_robot_description/meshes/cs63/custom/connector.stl" scale="0.001 0.001 0.001"/>
        </geometry>
      </collision>
    </link>

    <joint name="${tf_prefix}tool0-connector" type="fixed">
      <origin xyz="0 0 0" rpy="1.5708 0  0 "/>
      <parent link="${tf_prefix}tool0"/>
      <child link="${tf_prefix}connector_link"/>
    </joint>
```
导入进来后，有两个变换关系：joint 中的 <origin> 定义了子 link（connector_link）坐标系相对于父 link（tool0）坐标系的变换；link 中 visual/collision 里的 <origin> 定义了几何体在该 link 自身坐标系下的偏移。 对于连接件的安装具体位置，通过修改joint的origin来调节。摄像头同理，最终效果如下图所示：
![image.png](https://img.zzliu.com/file/1778636294531_image.png)



## SRDF(Semantic Robot Description Format)

防止机器人自身链接之间的碰撞检测把我们新加入的部件一直认为碰撞，需要在eli_cs_robot_moveit_config/srdf/cs_macro.srdf.xacroSRDF 中禁用相邻部件对连接件和摄像头的检测，具体代码如下所示：

```
<disable_collisions link1="${prefix}wrist_3_link" link2="${prefix}connector_link" reason="Adjacent" />
<disable_collisions link1="${prefix}connector_link" link2="${prefix}camera_link" reason="Adjacent" />
```

还需要将Moveit的规划末端位置改成我们新设置的摄像头的TCP位置，具体代码如下所示：

```
<group name="${prefix}${name}_manipulator">
      <chain base_link="${prefix}base_link" tip_link="${prefix}camera_tcp" />
</group>
```


# 机械臂相关设置
为了防止机械臂移动时末端碰撞到安装平面，需设置安全平面来限制机械臂的行动，艾利特的机械臂安全设置是独立于操控模式的，即使在远程操控模式下依然生效，相当于给我规划的点位增加了一层保险，同时安全平面的各个点位都是机械臂硬件测量出来的，比在MoveIt中设定的碰撞检测更加准确。
## 设置安装位置(可选)
指定机器人本体的安装有两个目的：
- 在屏幕上正确显示机械臂。
- 告知控制器重力方向。
  
我不采用奇奇怪怪的安装方式，所以安装方式默认即可，主要设置的目的就是正确显示机械臂，机械臂回归零位后从指定视角观察机械臂，然后将屏幕中的机械臂旋转到和实际观看到的一致。注意这里不影响零位的定义，仅仅是显示上的调整。 界面如下：
![image.png](https://img.zzliu.com/file/1778317900231_image.png)

## 设置TCP
TCP（Tool Center Point）是指机械臂末端执行器的中心点位置，正确设置TCP对于机械臂的精确操作至关重要。默认TCP为机械臂的法兰盘中心位置，后续步骤需要使用TCP测量点位，法兰盘中心点过于模糊，无法满足精确测量的要求，所以调整TCP到我设计的相机连接件角点位置，如图所示：
![image.png](https://img.zzliu.com/file/1778318731155_image.png)
TCP的设置如下图所示，将连接件安装到机械臂后，选择工作空间中的一个固定点位，使用机械臂让选择的TCP点以不同的方向触碰到该位置，机械臂会自动计算出TCP相对于法兰盘中心的位置偏移，并将新的TCP位置保存下来。
![image.png](https://img.zzliu.com/file/1778318961200_image.png)
有了新的TCP后，我们就有了一个有力的工具，可以测量任何工作空间的点位坐标（相当于极坐标系）。

## 底座坐标系搭建

安全平面是以坐标系为基础搭建的，我们需要先创建底座的坐标系，才能在安全平面中使用它。
底座坐标系我以底座的左下角为原点，X轴沿底座的的右手边方向，Y轴沿底座的正前方方向，Z轴垂直向上。创建坐标系也同样的采用示教方式，首先通过TCP确定坐标系的原点，之后确定X轴的正方向，只需要在X轴正方向的底座上随便点一个点即可，然后再确定Y轴正方向，同样，具体如图所示：
![image.png](https://img.zzliu.com/file/1778319453469_image.png)

## 安全平面设置
安全平面以底座坐标系为基准即可，只可设置沿Z轴的偏移方向，默认沿Z轴正方向，这里我设置为30
mm，留一些冗余空间，注意还要把肘部关节也勾选上，否则机械臂在肘部位置可能会碰撞到安装平面。约束模式选择正常和缩减，即所有模式都触发。
![image.png](https://img.zzliu.com/file/1778319976210_image.png)

## 安全工具设置
默认检查是以法兰盘中心位置的那个tcp来检测的，而且半径是0，需要改成我设置的tcp，设置界面如下图所示：
![image.png](https://img.zzliu.com/file/1778320148873_image.png)


设置好的效果展示如下所示，机械臂在安全平面内正常运动，一旦越过安全平面就会触发碰撞检测，机械臂会立即停止运动并发出警告。



<video controls style="width:100%">
  <source src="https://img.zzliu.com/file/1778320755218_ac6fcc5579886363ca0593ccd965d259.mp4" type="video/mp4" />
</video>


设置的各坐标系如下图所示，从正面看屏幕显示的也和实际机械臂位置相同：
![35558e26-b391-4d45-afe4-98f6a67ff980.png](https://img.zzliu.com/file/1778321023139_35558e26-b391-4d45-afe4-98f6a67ff980.png)