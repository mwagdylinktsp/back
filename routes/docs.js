const express = require('express');
const router = express.Router();

// صفحة التوثيق الرئيسية
router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>توثيق API نوروين</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                    direction: rtl;
                }
                .endpoint {
                    background-color: white;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .method {
                    font-weight: bold;
                    color: #fff;
                    background-color: #3498db;
                    padding: 5px 10px;
                    border-radius: 3px;
                }
                pre {
                    background-color: #f8f9fa;
                    padding: 10px;
                    border-radius: 3px;
                    text-align: left;
                    direction: ltr;
                }
                h1 {
                    color: #2c3e50;
                }
            </style>
        </head>
        <body>
            <h1>توثيق واجهات برمجة التطبيق</h1>
            
            <div class="endpoint">
                <h2><span class="method">POST</span> /api/auth/login</h2>
                <h3>الوصف:</h3>
                <p>تسجيل الدخول للمستخدمين</p>
                
                <h3>البيانات المطلوبة:</h3>
                <pre>
{
    "username": "string",
    "password": "string"
}
                </pre>

                <h3>الاستجابة الناجحة (200):</h3>
                <pre>
{
    "token": "JWT_TOKEN",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
    }
}
                </pre>
            </div>

            <div class="endpoint">
                <h2><span class="method">POST</span> /api/auth/register</h2>
                <h3>الوصف:</h3>
                <p>تسجيل مستخدم جديد</p>
                
                <h3>البيانات المطلوبة:</h3>
                <pre>
{
    "username": "string",
    "password": "string"
}
                </pre>

                <h3>الاستجابة الناجحة (200):</h3>
                <pre>
{
    "id": 1,
    "username": "username",
    "message": "تم إنشاء المستخدم بنجاح"
}
                </pre>
            </div>

            <div class="endpoint">
                <h2><span class="method">GET</span> /api/companies</h2>
                <h3>الوصف:</h3>
                <p>الحصول على قائمة الشركات</p>
                
                <h3>الترويسات المطلوبة:</h3>
                <pre>
Authorization: Bearer JWT_TOKEN
                </pre>

                <h3>الاستجابة الناجحة (200):</h3>
                <pre>
[
    {
        "id": 1,
        "name": "اسم الشركة",
        "contract_type": "نوع العقد",
        "contract_start": "2023-01-01T00:00:00.000Z",
        "contract_end": "2024-01-01T00:00:00.000Z",
        "amount": 5000,
        "status": "active",
        "created_at": "2023-01-01T00:00:00.000Z"
    }
]
                </pre>
            </div>
        </body>
        </html>
    `);
});

module.exports = router;