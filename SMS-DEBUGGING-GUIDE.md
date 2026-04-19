# SMS Delivery Debugging Guide

## 🔍 How to Test SMS Delivery

### Step 1: Start Backend with Console Monitoring
```bash
cd backend
npm start
```

### Step 2: Check Console Output During Registration

When you **register a new user**, look for:
```
✓ User registered successfully
```

### Step 3: Check Console Output When Creating Fine

When PD **creates a fine**, check backend console for these logs:

**✅ Expected Success Sequence:**
```
1️⃣ 🔍 SMS Debug - Employee Data: { phone: '3215555555', carrier: 'zong', userId: '...' }
2️⃣ 📱 Attempting SMS via zong gateway to phone: 3215555555
3️⃣ 📧 SMS Gateway Email: 3215555555@sms.zong.com.pk
4️⃣ ✓ SMS sent successfully to: 3215555555@sms.zong.com.pk
5️⃣ 📱 SMS Result: ✓ Sent
```

**❌ Common Error Sequences:**

### Error 1: Carrier Not Found
```
🔍 SMS Debug - Employee Data: { phone: '3215555555', carrier: null, userId: '...' }
⚠️ SMS not sent - Missing: { hasEmployee: true, hasPhone: true, hasCarrier: false }
```
**Fix:** Ensure carrier was selected and saved during registration

### Error 2: Invalid Phone Number Format
```
⚠️ SMS not sent - invalid phone number format. Length: 11 (expected 10)
```
**Fix:** Phone must be exactly 10 digits, e.g., `3215555555` (not `03215555555` or `+923215555555`)

### Error 3: Unsupported Carrier
```
⚠️ SMS not sent - unsupported carrier: xyz
📋 Supported carriers: ['jazz', 'telenor', 'zong', 'ufone', 'warid', 'mobilink', 'ptcl', ...]
```
**Fix:** Select from the supported carriers list

### Error 4: Email Service Not Configured
```
⚠️ Email service not configured. Missing: ['EMAIL_USER', 'EMAIL_PASSWORD']
```
**Fix:** Check `.env` file has EMAIL_USER and EMAIL_PASSWORD set

---

## 🧪 Complete Test Flow

### Test 1: Register User with Zong
```
1. Go to Register page
2. Username: testuser
3. Email: testuser@email.com
4. Password: password123
5. Phone: 3215555555
6. Carrier: Zong ← SELECT THIS
7. Click Register
8. Check console for log showing carrier saved
```

### Test 2: Create Fine for User
```
1. Login as PD (username: PD, password: admin)
2. Go to Manage Fines
3. Select employee: testuser
4. Category: Late
5. Amount: 100
6. Click Add Fine
7. CHECK BACKEND CONSOLE FOR LOGS:
   - Should see "🔍 SMS Debug - Employee Data: ..."
   - Should see "📱 Attempting SMS via zong gateway..."
   - Should see "📧 SMS Gateway Email: 3215555555@sms.zong.com.pk"
```

---

## 📊 Frontend Console Logs

If you want to debug from frontend, open Browser DevTools (F12) and check:

```javascript
// Check if form is properly sending data
console.log(form.value)  // Should show: { username, email, password, phone, carrier: 'zong' }
```

---

## 🔧 What to Check If SMS Not Received

| Issue | Check | Solution |
|-------|-------|----------|
| **Carrier showing as null** | DB check in MongoDB → User document | Make sure carrier dropdown was visible and selected |
| **Phone format error** | Backend console for "invalid phone number" | Phone must be 10 digits: `3215555555` |
| **Email gateway not working** | Check if regular emails send (email notifications) | Verify EMAIL_USER and EMAIL_PASSWORD in .env |
| **Carrier not found** | Backend console for "unsupported carrier" | Use supported carriers: jazz, telenor, zong, ufone, warid, mobilink, ptcl |
| **Database not updated** | MongoDB Compass → check User collection | Manually verify carrier field was saved |

---

## 🐛 MongoDB Debug Commands

If you have MongoDB Compass, you can check:

```javascript
// Find the user you registered
db.users.findOne({ username: 'testuser' })

// Should return something like:
{
  _id: ObjectId(...),
  username: 'testuser',
  email: 'testuser@email.com',
  phone: '3215555555',
  carrier: 'zong',           // ← THIS SHOULD NOT BE NULL
  role: 'employee',
  createdAt: timestamp,
  ...
}
```

---

## ✅ Checklist Before Testing

- [ ] Backend running (`npm start` in backend folder)
- [ ] Email credentials in `.env` are correct
- [ ] Frontend showing carrier dropdown (no `v-if` hiding it)
- [ ] New user registered with all fields including phone and carrier
- [ ] PD created a fine for that user
- [ ] Checked backend console for logs

---

## 📝 Expected SMS Gateway Emails

| Carrier | Example Email | Phone |
|---------|---------------|-------|
| Jazz | `3215555555@sms.jazz.com.pk` | 3215555555 |
| Telenor | `3215555555@sms.telenor.com.pk` | 3215555555 |
| Zong | `3215555555@sms.zong.com.pk` | 3215555555 |
| Ufone | `3215555555@sms.ufone.com.pk` | 3215555555 |
| Warid | `3215555555@sms.warid.com.pk` | 3215555555 |
| Mobilink | `3215555555@sms.mobilink.com.pk` | 3215555555 |
| PTCL | `3215555555@sms.ptcl.com.pk` | 3215555555 |

---

## 🎯 Quick Debug Steps

1. **Start backend:** `npm start`
2. **Create new user** with phone and carrier
3. **Login as PD**
4. **Create fine**
5. **Check backend console** for the debug logs above
6. **Share the console output** if SMS still not working

The console logs will tell us exactly where the process is failing!
