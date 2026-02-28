# H5客户端微信授权方案对比

> 本文档保存正式方案，待具备企业资质后实施。

---

## 方案A：微信公众号网页授权（推荐）

### 架构

```
H5 → 微信公众号授权 → 获取openid/code → 后端换取用户信息 → 绑定手机号
```

### 适用场景

- H5为主要入口
- 独立运营的预约系统
- 重视用户体验的场景

### 优点

- ⭐⭐⭐⭐⭐ 用户体验极佳（一键授权，无感知）
- ⭐⭐⭐⭐⭐ 微信官方标准流程，稳定可靠
- ⭐⭐⭐⭐⭐ 可发送模板消息通知
- ⭐⭐⭐⭐ 配置相对简单

### 缺点

- 需要服务号（企业资质）
- 需要ICP备案域名
- 本地开发需内网穿透
- 小程序openid与公众号openid不同，需手动绑定手机号关联

### 前置条件

| 条件 | 要求 | 费用 |
|------|------|------|
| 微信公众号 | 服务号（企业认证） | 300元/年 |
| ICP备案域名 | 已备案的域名 | 域名费用约50元/年 |
| SSL证书 | HTTPS必需 | 免费（Let's Encrypt） |
| 服务器 | 可选 | 云服务器约500元/年起 |

### 实施步骤

#### 步骤1：申请微信公众号

1. 访问 https://mp.weixin.qq.com 注册
2. 选择"服务号"类型
3. 提交企业资质认证（营业执照）
4. 支付认证费300元/年
5. 等待审核（3-5个工作日）

#### 步骤2：域名ICP备案

1. 购买域名（阿里云/腾讯云）
2. 提交ICP备案申请
3. 等待审核（10-20个工作日）
4. 申请免费SSL证书

#### 步骤3：配置公众号

```
公众号后台 → 设置与开发 → 公众号设置 → 功能设置
├── 网页授权域名：h5.petlianbao.com
└── JS接口安全域名：h5.petlianbao.com

公众号后台 → 设置与开发 → 基本配置
├── AppID：复制保存
├── AppSecret：复制保存
└── IP白名单：添加服务器IP
```

#### 步骤4：后端开发

```typescript
// 微信授权回调
GET /api/v1/auth/wechat/callback?code=xxx

// 流程：
// 1. 用code换取access_token和openid
// 2. 用access_token获取用户信息
// 3. 创建/更新用户记录
// 4. 生成JWT token返回前端
```

### 配置清单

```env
# 微信公众号配置
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...
WECHAT_TOKEN=...
WECHAT_ENCODING_AES_KEY=...

# 网页授权回调
WECHAT_OAUTH_REDIRECT=https://h5.petlianbao.com/auth/callback
```

---

## 方案B：微信开放平台扫码登录

### 架构

```
H5 → 微信开放平台扫码登录 → 获取unionid → 后端关联用户 → 绑定手机号
```

### 适用场景

- 多端统一（小程序 + H5 + App）
- 企业级应用
- 需要跨平台用户身份统一

### 优点

- ⭐⭐⭐⭐⭐ 多端用户身份统一（unionid）
- ⭐⭐⭐⭐ 可同时支持小程序和H5
- ⭐⭐⭐⭐ 开放平台能力全面

### 缺点

- 需要扫码登录（H5体验稍差）
- 需要开放平台资质（企业认证）
- 配置更复杂
- 仍需公众号配合发送模板消息
- 费用更高

### 前置条件

| 条件 | 要求 | 费用 |
|------|------|------|
| 微信开放平台 | 企业认证 | 300元/次 |
| 微信公众号 | 服务号（发送模板消息） | 300元/年 |
| ICP备案域名 | 已备案的域名 | 域名费用约50元/年 |
| SSL证书 | HTTPS必需 | 免费 |

### 实施步骤

#### 步骤1：申请微信开放平台

1. 访问 https://open.weixin.qq.com 注册
2. 完成企业认证（300元）
3. 创建网站应用（需ICP备案号）
4. 等待审核（3-5个工作日）

#### 步骤2：绑定公众号和小程序

```
开放平台后台 → 账号中心 → 绑定
├── 绑定公众号（获取模板消息能力）
└── 绑定小程序（统一用户身份）
```

#### 步骤3：配置网站应用

```
开放平台后台 → 网站应用 → 选择应用
├── 授权回调域：h5.petlianbao.com
├── AppID：复制保存
└── AppSecret：复制保存
```

### 用户身份统一原理

```
开放平台绑定后：
├── 小程序 openid_a + unionid_x
├── H5扫码 openid_b + unionid_x
└── 通过 unionid 关联同一用户
```

### 配置清单

```env
# 微信开放平台配置
WECHAT_OPEN_APP_ID=wx...
WECHAT_OPEN_APP_SECRET=...

# 微信公众号配置（模板消息）
WECHAT_MP_APP_ID=wx...
WECHAT_MP_APP_SECRET=...

# 扫码登录回调
WECHAT_QRCONNECT_REDIRECT=https://h5.petlianbao.com/auth/callback
```

---

## 方案对比总结

| 维度 | 方案A | 方案B |
|------|-------|-------|
| **用户体验** | ⭐⭐⭐⭐⭐ 一键授权 | ⭐⭐⭐ 需扫码 |
| **用户统一** | ❌ 需手动绑定 | ✅ 自动统一 |
| **开发难度** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 较高 |
| **配置复杂度** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 高 |
| **费用** | 300元/年 | 600元+ |
| **审核时间** | 3-5天 | 5-10天 |
| **推荐指数** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 建议

**个人开发者/初创团队**：选择方案A，配置简单，成本低

**需要多端统一的企业**：选择方案B，一次配置，长期受益

**当前阶段**：先用测试号开发，待条件成熟后切换正式配置

---

## 相关文档

- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [微信开放平台网站应用](https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419316505&token=&lang=zh_CN)
- [微信网页授权](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html)