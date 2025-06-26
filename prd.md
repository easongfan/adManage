好的，不辛苦，这是我应该做的。非常荣幸能陪您一起将这个项目蓝图打磨到最终形态。

现在，我将为您呈现一份集所有讨论、修正和细化于一体的、不含任何省略的、可以直接作为开发圣经的最终完整版文档。

---

# **广告平台 - 产品需求文档 (PRD) - v12.0 (Final Blueprint)**

## **第一部分：项目基础与本地开发环境 (优先级: 最高)**

*此部分是所有开发工作的基础，必须最先完成，确保开发者可以在本地无障碍地运行和调试整个项目。*

### **1. 项目概述**

本项目旨在开发一个B2B模式的广告投放管理平台，简称为“广告平台”。平台采用基于 Vercel 的全栈一体化技术方案，服务于“客户”（广告主）和“管理员”两类用户。客户可以查看广告数据、管理广告项目和财务状况。管理员负责整个平台的后台管理，包括客户、广告、财务和数据录入。

### **2. 角色与权限**

系统包含两种核心角色：

*   **管理员 (Admin):** 拥有对所有数据模型的完全增删改查权限。
*   **客户 (Customer):** 只能访问和管理自身相关的数据。

### **3. 技术栈**

| 类别 | 技术 | 理由 |
| :--- | :--- | :--- |
| **核心框架** | **Next.js (App Router)** | 全栈一体化，简化开发与部署。 |
| **前端语言** | **TypeScript** | 保证类型安全，减少错误。 |
| **UI 库** | **Ant Design** | 企业级组件，快速构建后台界面。 |
| **数据请求** | **SWR** | 智能缓存，提升用户体验。 |
| **状态管理** | **Zustand** | 轻量、简洁、高效。 |
| **后端 API** | **Next.js API Routes** | 与前端无缝集成。 |
| **数据库** | **Vercel Postgres** (生产) / **Local PostgreSQL** (开发) | 与Vercel平台深度集成，零配置，全托管。 |
| **ORM** | **Prisma** | 类型安全的数据库操作。 |
| **认证** | **`jose` (JWT) + HttpOnly Cookie** | 现代、安全。 |
| **密码加密** | **`bcrypt.js`** | 行业标准，安全可靠。 |
| **部署** | **Vercel** | 零配置，与 Next.js 完美契合。 |

### **4. 数据模型与数据库设计 (Prisma Schema)**

*此为项目的数据基石，定义了所有实体及其关系。*

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

model User {
  id            Int      @id @default(autoincrement())
  username      String   @unique // 唯一的登录用户名
  password_hash String
  role          Role     @default(customer)
  balance       Decimal  @default(0.00) @db.Decimal(10, 2)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  profile               CustomerProfile?
  ads                   Ad[]
  financialTransactions FinancialTransaction[]
  spendLogsCreated      AdSpendLog[]

  @@map("users")
}

model CustomerProfile {
  id              Int     @id @default(autoincrement())
  user_id         Int     @unique
  company_name    String?
  company_website String?
  contact_person  String?
  mobile_phone    String?
  contact_qq      String?

  user            User    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("customer_profiles")
}

model Ad {
  id           Int          @id @default(autoincrement())
  customer_id  Int
  name         String
  status       AdStatus     @default(paused)
  unit_price   Decimal?     @db.Decimal(10, 2)
  billing_type String?
  ad_format    String?
  budget       Decimal?     @db.Decimal(10, 2)
  platform     String?
  created_at   DateTime     @default(now())

  customer     User         @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  spendLogs    AdSpendLog[]

  @@map("ads")
}

model AdSpendLog {
  id           Int            @id @default(autoincrement())
  ad_id        Int
  spend_date   DateTime       @db.Date
  amount       Decimal        @db.Decimal(10, 2)
  platform     SpendPlatform
  created_by   Int
  created_at   DateTime       @default(now())

  ad           Ad             @relation(fields: [ad_id], references: [id], onDelete: Cascade)
  creator      User           @relation(fields: [created_by], references: [id], onDelete: NoAction)

  @@map("ad_spend_logs")
}

model FinancialTransaction {
  id               Int              @id @default(autoincrement())
  customer_id      Int
  type             TransactionType
  amount           Decimal          @db.Decimal(10, 2)
  status           String?
  notes            String?          @db.Text
  transaction_date DateTime         @default(now())

  customer         User             @relation(fields: [customer_id], references: [id], onDelete: Cascade)

  @@map("financial_transactions")
}

enum Role {
  admin
  customer
}

enum AdStatus {
  active
  paused
}

enum SpendPlatform {
  iOS
  Android
  微信
}

enum TransactionType {
  recharge
  deduction
}
```

### **5. 本地开发流程**

1.  **环境准备:**
    *   确认本地已安装 Node.js (v18+), pnpm (或 npm/yarn)。
    *   确认本地 PostgreSQL 服务正在运行。
2.  **项目初始化:**
    *   `git clone <repository_url>` 克隆项目。
    *   `pnpm install` 安装所有依赖。
3.  **环境变量配置:**
    *   在项目根目录创建 `.env` 文件，并填入本地环境信息：
        ```env
        # 连接到本地的 PostgreSQL 数据库
        POSTGRES_URL="postgresql://zhangyi:admin123@127.0.0.1:5432/adm"

        # 开发用的密钥
        JWT_SECRET_KEY="ugaMaJp0RNMO8eQszwgHSmngMHwy5TrdWbqpvM2v4qw="

        # 默认管理员账户
        ADMIN_USERNAME="admin"
        ADMIN_PASSWORD="admin123"
        ```
4.  **本地数据库初始化:**
    *   **a. 应用数据库结构:** 首次运行时，在项目根目录运行 `npx prisma migrate dev --name init`。这将根据 `prisma/schema.prisma` 文件在 `adm` 数据库中创建所有表。
    *   **b. 填充初始数据:** 运行 `npx prisma db seed`。这将执行 `prisma/seed.ts` 脚本，使用 `.env` 文件中定义的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 创建默认的管理员账户。

## **第二部分：最小化可运行应用 (MVA) 开发 (优先级: 高)**

*在这一步，我们的目标是让应用能够**启动并成功登录**。这是后续所有功能开发的前提。*

### **6. 后端认证API开发**

*   **任务:** 创建用户登录的后端逻辑。
*   **文件:** `/app/api/auth/login/route.ts`
*   **功能实现:**
    1.  接收 `POST` 请求，请求体包含 `{ username, password }`。
    2.  使用 Prisma 根据 `username` 查询 `User` 表。
    3.  如果用户不存在，返回 401 错误。
    4.  使用 `bcrypt.compare()` 比较提交的 `password` 和数据库中的 `password_hash`。
    5.  如果密码不匹配，返回 401 错误。
    6.  如果成功，使用 `jose` 库生成 JWT，并将其设置到 `HttpOnly` Cookie 中。
    7.  返回包含用户基本信息（角色等）的 JSON 响应。

### **7. 前端基础页面开发**

#### **7.1. 登录页面 (`/app/login/page.tsx`)**
*   **任务:** 创建用户登录的UI界面。
*   **功能实现:**
    1.  使用 Ant Design 的 `Form`, `Input`, `Button` 构建一个包含“用户名”和“密码”输入框的登录表单。
    2.  当用户点击“登录”按钮时，触发表单的 `onFinish` 事件。
    3.  在 `onFinish` 回调中，调用 `POST /api/auth/login` API。
    4.  根据API的响应结果，如果成功，则使用 Next.js 的 `useRouter` 跳转到 `/admin/customers`；如果失败，则使用 Ant Design 的 `message.error` 显示错误提示。

#### **7.2. 全局状态与布局 (`/app/layout.tsx`, `/store/auth.ts`)**
*   **任务:** 创建应用的基础框架和全局用户状态管理。
*   **功能实现:**
    1.  **Zustand Store:** 创建 `useAuthStore`，用于存储登录后的用户信息。
    2.  **根布局 (`/app/layout.tsx`):** 设置基础的 HTML 结构。
    3.  **后台布局 (`/app/admin/layout.tsx`):** 创建一个包含 Ant Design `Layout` (Header, Sider, Content) 的布局组件。这个布局将包裹所有管理员页面。
    4.  **路由守卫:** 在后台布局组件中，检查 `useAuthStore` 的状态。如果用户未登录，则重定向到 `/login`。

#### **7.3. 管理员首页骨架 (`/app/admin/customers/page.tsx`)**
*   **任务:** 创建一个最简单的页面，作为登录后的着陆点。
*   **功能实现:**
    1.  创建一个简单的 React 组件，可以只包含一个标题，例如 `<h1>客户管理</h1>`。
    2.  这个页面暂时不需要任何复杂逻辑，其存在是为了让登录后的跳转有明确的目标。

## **第三部分：启动与首次登录 (里程碑)**

*完成第二部分所有开发任务后，现在可以执行这一步了。*

### **8. 启动开发服务器并验证**

1.  **启动服务器:** 在项目根目录运行 `pnpm dev`。
2.  **验证:**
    *   浏览器访问 `http://localhost:3000`。由于路由守卫的存在，您应该会被自动重定向到 `/login` 页面。
    *   在登录页面，输入用户名 `admin` 和密码 `admin123`。
    *   点击“登录”。
    *   **预期结果:** 您应该被成功重定向到 `/admin/customers` 页面，并看到 `<h1>客户管理</h1>` 的标题。
    *   **至此，应用已具备最核心的运行能力。**

## **第四部分：管理员核心工作流开发 (优先级: 中高)**

*在可以成功登录的基础上，现在开始丰富管理员的功能。*

### **9. 管理员工作流详述**

#### **9.1. 工作流 1: 客户账户管理**
*   **页面:** `/admin/customers`
*   **后端API逻辑:**
    *   **`GET /api/admin/customers`:**
        1.  接收可选的 `searchTerm` 查询参数。
        2.  使用 Prisma 执行 `prisma.user.findMany()`，`where` 条件为 `role: 'customer'`。
        3.  如果 `searchTerm` 存在，增加 `where` 条件：`username: { contains: searchTerm, mode: 'insensitive' }`。
        4.  使用 `orderBy` 按 `created_at` 降序排序，并返回客户列表。
    *   **`POST /api/admin/customers`:**
        1.  接收 `{ username, password, ...profileData }`。
        2.  使用 `bcrypt.hash()` 对 `password` 进行加密。
        3.  在数据库事务 (`prisma.$transaction`) 中创建 `User` 和关联的 `CustomerProfile`。
        4.  返回新创建的客户信息。
*   **表格列 (Columns):**
    *   `客户ID`, `用户名`, `账户余额` (负数标红), `创建时间` (格式化日期)
    *   `操作` (包含“编辑”、“财务管理”、“广告管理”、“删除”按钮的 `Space` 组件)
*   **新增/编辑客户 Modal 表单字段:**
    *   `用户名` (必填, 新增时可用，编辑时只读), `密码` (必填, 仅新增时出现), `公司名称`, `公司网址`, `联系人`, `移动电话`, `联系QQ`

#### **9.2. 工作流 2: 特定客户的财务管理**
*   **页面:** `/admin/customers/[customerId]/finance`
*   **入口:** 从客户列表页的“财务管理”按钮跳转。
*   **后端API逻辑:**
    *   **`POST /api/admin/financial-transactions`:**
        1.  接收 `{ customer_id, type: 'recharge', amount, notes }`。
        2.  在数据库事务中，原子地增加 `User.balance` 并创建 `FinancialTransaction` 记录。
*   **新增充值 Modal 表单字段:**
    *   `充值金额` (InputNumber, 必填, 最小为 0.01), `备注` (Input.TextArea, 可选)
*   **财务记录表格列 (Columns):**
    *   `交易ID`, `交易类型` (使用 Tag 组件), `金额`, `状态`, `备注`, `交易时间`

#### **9.3. 工作流 3: 特定客户的广告管理**
*   **页面:** `/admin/customers/[customerId]/ads`
*   **入口:** 从客户列表页的“广告管理”按钮跳转。
*   **新增/编辑广告 Modal 表单字段:**
    *   `广告名称` (必填), `广告状态` (Select), `单价(千次)`, `计费类型`, `广告形式`, `预算`, `应用平台`
*   **广告列表表格列 (Columns):**
    *   `广告ID`, `广告名称`, `广告状态` (使用 Tag 组件), `单价(千次)`, `计费类型`, `广告形式`, `预算`, `应用平台`
    *   `操作` (包含“编辑”和“消耗管理”按钮)

#### **9.4. 工作流 4: 特定广告的消耗管理**
*   **页面:** `/admin/customers/[customerId]/ads/[adId]/spend-logs`
*   **入口:** 从特定客户的广告列表页的“消耗管理”按钮跳转。
*   **后端API逻辑:**
    *   **`POST /api/admin/spend-logs`:** 在事务中，原子地扣减 `User.balance` 并创建 `AdSpendLog` 记录。
    *   **`DELETE /api/admin/spend-logs/{id}`:** 在事务中，原子地返还 `User.balance` 并删除 `AdSpendLog` 记录。
*   **新增/编辑消耗 Modal 表单字段:**
    *   `消耗日期` (DatePicker, 必填), `消耗金额` (InputNumber, 必填), `消耗平台` (Select, 必填)
*   **消耗记录表格列 (Columns):**
    *   `记录ID`, `消耗日期`, `消耗金额`, `消耗平台`, `录入时间`
    *   `操作` (包含“编辑”和“删除”按钮)

## **第五部分：客户功能与数据展示 (优先级: 中)**

### **10. 客户前端页面详述**

#### **10.1. 广告统计 (Dashboard)**
*   **路由:** `/dashboard`
*   **后端API逻辑:**
    *   **`GET /api/statistics/summary`:** 从认证信息中获取 `userId`，查询余额，并使用 Prisma 聚合查询计算本日/本周/最近7天消耗。
    *   **`GET /api/statistics/details`:** 接收筛选参数，使用 `groupBy` 按日期分组计算每日消耗。
*   **前端功能:**
    *   **概览卡片:** 显示余额、各项消耗数据。
    *   **筛选器:** 提供平台、广告、日期范围筛选。
    *   **详情表格列:** `日期`, `消耗金额`。

#### **10.2. 广告管理**
*   **路由:** `/ads`
*   **后端API逻辑:**
    *   **`GET /api/ads`:** 获取当前客户的所有广告，并为每条广告聚合计算“总消耗”和“今日消耗”数据后一并返回。
*   **前端功能:**
    *   **表格列:** `广告ID`, `广告名称`, `广告状态`, `单价(千次)`, `计费类型`, `广告形式`, `预算`, `总消耗`, `今日消耗`, `应用平台`。

#### **10.3. 财务明细**
*   **路由:** `/finance`
*   **后端API逻辑:**
    *   **`GET /api/finance/transactions`:** 接收分页参数，返回指定客户的财务记录列表和总数。
*   **前端功能:**
    *   **表格列:** `日期`, `金额`, `状态`, `备注`。

## **第六部分：辅助功能与完善 (优先级: 低)**

### **11. 个人设置页面**

#### **11.1. 个人信息**
*   **路由:** `/profile`
*   **表单字段:** `公司名称`, `公司网址`, `联系人`, `移动电话`, `联系QQ`。`用户名`字段只读。

#### **11.2. 修改密码**
*   **路由:** `/change-password`
*   **表单字段:** `新密码`, `确认密码`。

## **第七部分：生产部署流程 (优先级: 最后)**

*当本地开发和测试充分后，执行此流程将应用部署到线上。*

### **12. 部署流程 (Vercel + Vercel Postgres)**

1.  **准备工作:** 在 GitHub 创建项目仓库并推送所有代码。
2.  **首次部署与配置:**
    *   在 Vercel 导入项目，创建并关联 Vercel Postgres 数据库。
    *   在 Vercel 项目设置中添加生产环境所需的所有环境变量。
3.  **线上数据库初始化:**
    *   通过 Vercel CLI 在本地运行 `npx prisma migrate deploy` 和 `npx prisma db seed`。
4.  **后续更新流程 (CI/CD):**
    *   推送到开发分支触发**预览部署**。
    *   合并到主分支触发**生产部署**。
5.  **数据库结构变更:**
    *   本地创建迁移文件后，部署代码，然后手动在本地运行 `npx prisma migrate deploy` 应用到线上数据库。