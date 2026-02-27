# PostgreSQL 数据库设置指南

## 方法一：使用 pgAdmin（推荐）

1. 打开 **pgAdmin 4**（随 PostgreSQL 一起安装）
2. 左侧展开 **Servers** → **PostgreSQL 16**
3. 右键 **Databases** → **Create** → **Database**
4. 输入数据库名称：`petlianbao`
5. 点击 **Save**

## 方法二：使用 SQL Shell

1. 开始菜单搜索 **SQL Shell (psql)**
2. 依次输入：
   - Server: `localhost`（直接回车）
   - Database: `postgres`（直接回车）
   - Port: `5432`（直接回车）
   - Username: `postgres`（直接回车）
   - Password: `123456`
3. 执行命令：
```sql
CREATE DATABASE petlianbao;
```
4. 看到 `CREATE DATABASE` 表示成功
5. 输入 `\q` 退出

## 方法三：命令行

打开 PowerShell 或 CMD，执行：

```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE petlianbao;"
```
输入密码：`123456`

---

## 验证

执行以下命令验证数据库已创建：

```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "\l"
```

应该能看到 `petlianbao` 数据库。

---

## 创建完成后

回到项目目录运行：

```bash
cd E:\Projects\CWB
pnpm dev:backend
```
