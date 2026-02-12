# 花砖沙盘

## 代码规约

### 页面

1, html文件决定页面结构，只写出唯一的、结构性的、不可交互的标签，由id标识。

2, 页面中非唯一的标签、动态的、可交互的标签，由该页面对应的主js生成，生成代码写在该js的Page类的构造器中。这些标签由class标识。

### 文件职能

| 文件名              | 职能                                                 |
| ------------------- | ---------------------------------------------------- |
| index.config.js     | 配置初始设置、应用对象和全局存储。                   |
| index.page.js       | 仅操作`index.html`的结构与样式，不处理复杂业务逻辑。 |
| index/canvas.js     | 仅处理画布内的动画效果，不负责点击等交互逻辑。       |
| index/game.js       | 处理切换编辑状态、切换玩家状态等游戏逻辑。           |
| index/operator.js   | 自动读写操作记录，实现撤销、下一步的功能。           |
| index/tile-event.js | 存储瓷砖的点击事件。                                 |

## 功能实现

### 实体（瓷砖）移动动画

定义一个瓷砖实体类，提供“创建，移动，销毁”方法。

定义一个包含最大移动区域的元素，所有移动实体创建时，直接插入到该元素中，根据 absolute 定位，通过改变 left 和 top 属性实现移动。

在可能被移动的位置上创建蒙版标签（相当于为实体预留的槽位），并保存这些蒙版对象。蒙版对象的属性可以标明该槽位中存在的实体。

创建实体：将实体标签添加到蒙版对象中，并在实体的属性中存储其所在的蒙版。

移动实体：移动前将蒙版属性中的实体改为空，然后通过计算相对位置差进行移动，移动后双向绑定蒙版和实体的属性。

计算相对位置差的函数如下，原理是获取画布和实体相对于屏幕的位置，并计算两者的差值，得出实体相对于画布的 left 和 top 值。

```js
/**
 * 获取一个子代元素在父代元素中的相对位置。
 * @param {Element} child 子代元素
 * @param {Element} parent 父代元素
 * @returns 
 */
function getRelativePosition(child, parent) {
    const childRect = child.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    let left = childRect.left - parentRect.left;
    let top = childRect.top - parentRect.top;
    return { left, top };
}
```
