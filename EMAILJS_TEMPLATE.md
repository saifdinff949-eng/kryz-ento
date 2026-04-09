# EmailJS Template for kryz en app

## Service Configuration
- **Service ID**: `service_pw8zwxs`
- **Template ID**: `template_4qc5ojs`
- **Public Key**: `-L9gViSwmmvXSDKAK`

## Template Variables
Copy this template to your EmailJS dashboard:

```
Subject: طلب جديد من kryz en app - {{service_type}}

الى المطور،

تم استلام طلب جديد من التطبيق:

📋 تفاصيل الطلب:
━━━━━━━━━━━━━━━━━━━━━
• نوع الخدمة: {{service_type}}
• اسم المستخدم / الرابط: {{username}}
• الكمية المطلوبة: {{quantity}}
• وقت الإرسال: {{timestamp}}
• نوع الجهاز: {{device}}

👤 معلومات المستخدم:
━━━━━━━━━━━━━━━━━━━━━
• الاسم: {{user_name}}
• البريد الإلكتروني: {{user_email}}

━━━━━━━━━━━━━━━━━━━━━
تم إرسال هذا الطلب تلقائياً من تطبيق kryz en app
```

## How to Setup EmailJS

1. Go to https://www.emailjs.com/
2. Create an account or login
3. Go to Email Services and connect your email (Gmail recommended)
4. Go to Email Templates and create a new template
5. Copy the template above
6. Use these variable names:
   - {{service_type}} - نوع الخدمة (متابعين، مشاهدات، لايكات، شير)
   - {{username}} - اسم المستخدم أو الرابط
   - {{quantity}} - الكمية المطلوبة
   - {{timestamp}} - وقت إرسال الطلب
   - {{device}} - نوع الجهاز
   - {{user_name}} - اسم المستخدم في التطبيق
   - {{user_email}} - البريد الإلكتروني للمستخدم

## Integration Code
The app already has EmailJS integration in the services screens.
Notifications will be sent automatically when users submit service requests.
