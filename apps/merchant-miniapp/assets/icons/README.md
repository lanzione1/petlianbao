# 小程序图标说明

小程序 tabBar 需要以下图标文件（PNG格式，81x81像素）：

## 所需图标

| 文件名 | 用途 | 建议颜色 |
|--------|------|----------|
| home.png | 首页-未选中 | 灰色 #999999 |
| home-active.png | 首页-选中 | 紫色 #667eea |
| customer.png | 客户-未选中 | 灰色 #999999 |
| customer-active.png | 客户-选中 | 紫色 #667eea |
| billing.png | 收银-未选中 | 灰色 #999999 |
| billing-active.png | 收银-选中 | 紫色 #667eea |
| marketing.png | 营销-未选中 | 灰色 #999999 |
| marketing-active.png | 营销-选中 | 紫色 #667eea |
| mine.png | 我的-未选中 | 灰色 #999999 |
| mine-active.png | 我的-选中 | 紫色 #667eea |

## 图标设计建议

1. **尺寸**: 81x81 像素
2. **格式**: PNG (支持透明)
3. **风格**: 线性图标，简洁明了
4. **颜色**: 
   - 未选中: #999999
   - 选中: #667eea

## 临时解决方案

在开发阶段，可以：

1. 使用微信开发者工具自带的默认图标
2. 或者注释掉 app.json 中 tabBar 的 iconPath 配置

```json
"tabBar": {
  "color": "#999999",
  "selectedColor": "#667eea",
  "list": [
    {
      "pagePath": "pages/index/index",
      "text": "首页"
    }
  ]
}
```

## 在线图标资源

- [iconfont](https://www.iconfont.cn/)
- [Flaticon](https://www.flaticon.com/)
