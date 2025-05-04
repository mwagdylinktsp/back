-- إنشاء جدول الشركات أولاً لأنه سيتم الإشارة إليه كـ foreign key
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND type in (N'U'))
BEGIN
    CREATE TABLE Companies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        contract_type NVARCHAR(50),
        contract_start DATE,
        contract_end DATE,
        amount DECIMAL(10,2),
        status NVARCHAR(20),
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- إنشاء جدول المستخدمين
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- إضافة عمود company_id إلى جدول المستخدمين إذا لم يكن موجوداً
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[Users]') 
    AND name = 'company_id'
)
BEGIN
    ALTER TABLE Users
    ADD company_id INT;

    -- إضافة foreign key constraint بعد إضافة العمود
    ALTER TABLE Users
    ADD CONSTRAINT FK_Users_Companies 
    FOREIGN KEY (company_id) 
    REFERENCES Companies(id);
END

-- إنشاء جدول الزيارات
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Visits]') AND type in (N'U'))
BEGIN
    CREATE TABLE Visits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        company_id INT FOREIGN KEY REFERENCES Companies(id),
        visit_date DATE,
        status NVARCHAR(20),
        notes NTEXT,
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- إنشاء جدول التذاكر
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE Tickets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        company_id INT FOREIGN KEY REFERENCES Companies(id),
        user_id INT FOREIGN KEY REFERENCES Users(id),
        title NVARCHAR(200),
        description NTEXT,
        status NVARCHAR(20),
        priority NVARCHAR(20),
        created_at DATETIME DEFAULT GETDATE()
    );
END

-- إنشاء جدول الفواتير
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND type in (N'U'))
BEGIN
    CREATE TABLE Invoices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        company_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status NVARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (company_id) REFERENCES Companies(id)
    );
END

-- إنشاء مستخدم admin إذا لم يكن موجوداً
IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
BEGIN
    INSERT INTO Users (username, password, role)
    VALUES ('admin', '$2b$10$ZYPfPBXY9xF9Q4Q9Q4Q9Q.Q9Q4Q9Q4Q9Q4Q9Q4Q9Q4Q9Q4Q9Q4', 'admin');
END