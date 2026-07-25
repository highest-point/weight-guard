# Weight Guard - 健康体重管理应用

一个现代化的健康体重管理应用，帮助用户管理任务、记录体重、撰写笔记，并通过AI生成个人成长报告。

## 🛠️ 技术栈

### 前端框架
- **React 19** - 用户界面构建
- **Vite 7** - 构建工具和开发服务器
- **Tailwind CSS 3** - 原子化CSS样式框架
- **Lucide React** - 图标库

### 后端服务
- **Firebase** - 全栈后端服务
  - Firebase Authentication - 用户认证
  - Cloud Firestore - 实时数据库
  - Firebase Storage - 文件存储

### 数据可视化
- **Recharts** - 图表组件库

### 其他工具
- **React Easy Crop** - 头像裁剪
- **Tesseract.js** - OCR图像识别
- **XLSX** - Excel文件处理
- **ESLint** - 代码质量检查

## ✨ 功能特性

### 1. 任务管理
- 创建、编辑、删除日常任务
- 任务状态管理（待完成、已完成）
- 跨日计划排期
- 任务分类管理

### 2. 体重管理
- 体重记录与趋势追踪
- 饮食记录与营养分析
- 运动记录与热量计算
- AI智能生成健康计划
- 健康偏好设置

### 3. 笔记管理
- 创建、编辑、删除笔记
- 笔记标签分类
- 笔记优先级设置
- 附件上传支持

### 4. 数据仪表盘
- 今日计划概览
- 任务完成统计
- 时间分配图表
- AI个人成长报告（周报/月报/年报）

### 5. 用户系统
- 用户注册与登录
- 个人资料管理
- 头像上传与裁剪
- 深色/浅色主题切换
- 通知中心

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/highest-point/weight-guard.git
   cd weight-guard
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，填写以下配置：

   **Firebase配置**（必需）：
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

   **其他配置**（可选）：
   ```env
   VITE_VOLCENGINE_API_KEY=your_volcengine_api_key
   VITE_VOLCENGINE_ENDPOINT=your_volcengine_endpoint
   VITE_APP_ID=weight-guard
   VITE_VIRTUAL_EMAIL_DOMAIN=@dailyplan.system
   ```

4. **运行开发服务器**
   ```bash
   npm run dev
   ```

   访问 http://localhost:5173 查看应用

5. **构建生产版本**
   ```bash
   npm run build
   ```

6. **预览生产版本**
   ```bash
   npm run preview
   ```

## 📁 项目结构

```
weight-guard/
├── src/
│   ├── components/          # 通用组件
│   │   ├── Card.jsx         # 卡片组件
│   │   ├── Sidebar.jsx      # 侧边栏导航
│   │   ├── Skeleton.jsx     # 骨架屏组件
│   │   └── ...
│   ├── config/             # 配置文件
│   │   └── firebase.js     # Firebase初始化
│   ├── context/            # React Context
│   │   ├── NotificationContext.jsx
│   │   └── SettingsContext.jsx
│   ├── hooks/              # 自定义Hooks
│   │   ├── useAuth.js      # 认证Hook
│   │   ├── useFirestore.js # Firestore Hook
│   │   └── ...
│   ├── modules/            # 功能模块
│   │   ├── DashboardModule.jsx  # 数据仪表盘
│   │   ├── TaskModule.jsx      # 任务管理
│   │   ├── WeightModule.jsx    # 体重管理
│   │   ├── NoteModule.jsx      # 笔记管理
│   │   └── SettingsModule.jsx  # 设置模块
│   ├── pages/              # 页面组件
│   │   └── AuthPage.jsx    # 登录/注册页面
│   ├── utils/              # 工具函数
│   ├── constants/          # 常量定义
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── .env.example            # 环境变量模板
├── package.json            # 项目依赖
├── vite.config.js          # Vite配置
├── tailwind.config.js      # Tailwind配置
└── eslint.config.js        # ESLint配置
```

## 🔧 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run lint` | 运行ESLint检查 |
| `npm run preview` | 预览生产构建 |

## 🐛 常见问题

### Q: Firebase配置如何获取？
A: 登录 [Firebase Console](https://console.firebase.google.com/)，创建项目后在项目设置中获取配置信息。

### Q: 项目无法启动？
A: 确保已正确配置 `.env` 文件，并且 Node.js 版本 >= 18.x。

### Q: 页面一直转圈？
A: 检查 Firebase 配置是否正确，确保网络可以访问 Firebase 服务。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Weight Guard** - 守护您的健康体重 💪
