const express = require('express');
const router = express.Router();

// صفحة التوثيق الرئيسية
router.get('/', (req, res) => {
    const apiDocs = {
        openapi: "3.0.0",
        info: {
            title: "Norween API Documentation",
            version: "1.0.0",
            description: "توثيق واجهات برمجة التطبيق لنظام نوروين"
        },
        paths: {
            "/api/auth/login": {
                post: {
                    summary: "تسجيل الدخول",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        username: {
                                            type: "string",
                                            description: "اسم المستخدم"
                                        },
                                        password: {
                                            type: "string",
                                            description: "كلمة المرور"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "تم تسجيل الدخول بنجاح",
                            content: {
                                "application/json": {
                                    example: {
                                        token: "JWT_TOKEN",
                                        role: "admin"
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "خطأ في البيانات المدخلة"
                        }
                    }
                }
            }
            // يمكن إضافة المزيد من المسارات هنا
        }
    };

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
    "role": "admin"
}
                </pre>
            </div>
        </body>
        </html>
    `);
});

module.exports = router;