# موقع دار روضة المحبين

موقع ثابت (HTML) + Firebase للتحديث الفوري لكل الزوار.

## خطوات التشغيل
1. **Firebase:** أنشئ مشروعًا في console.firebase.google.com ← أضف تطبيق ويب ← انسخ الإعدادات إلى `firebase-config.js`.
2. **قاعدة البيانات:** Build ← Firestore Database ← Create database، ثم تبويب Rules والصق محتوى `firestore.rules` واضغط Publish.
3. **تسجيل الدخول:** Build ← Authentication ← Sign-in method ← فعّل Google. ثم Settings ← Authorized domains ← أضف `YOUR-USERNAME.github.io`.
4. **GitHub Pages:** في المستودع: Settings ← Pages ← Source: Deploy from a branch ← main / (root).
5. **اجعل نفسك مديرًا:** افتح الموقع واضغط «دخول» بحسابك، ثم من Authentication ← Users انسخ الـ UID الخاص بك، وفي Firestore أنشئ مجموعة `admins` ووثيقة رقمها هو الـ UID (يمكن ترك الحقول فارغة أو إضافة حقل `ok`=true). حدّث الصفحة وستظهر «لوحة الإشراف».
6. **المعلمون:** يسجل كل معلم دخوله مرة واحدة، ثم أضفه من لوحة الإشراف ← المعلمون واربطه بمجموعته.

الصور: `assets/logo.jpg` (الشعار) و `assets/art.jpg` (الشعار الزخرفي) — استبدلهما بنفس الاسم لتغييرهما.
