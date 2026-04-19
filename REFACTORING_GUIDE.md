# Fine Collection App - Refactored Setup Guide

## ✅ Completed Refactoring

This application has been refactored to align with the proper use case: **Tracking employee fines assigned by Project Directors (PD)**.

### Major Changes

1. **PD User Setup** - Use the setup script to create a PD account
2. **Design Standardization** - Clean, light theme matching login screen across all pages
3. **Role-Based Access Control** - Proper separation of PD and Employee views
4. **Employee Dashboard** - Employees see only their assigned fines
5. **PD Management Panel** - PD can manage all fines in a dedicated interface
6. **Notification System** - Toast notifications for all user actions

---

## 🚀 Quick Start

### 1. Create the PD User Account

```bash
cd backend
npm install  # if not already done
node setupPD.js
```

This will create a PD account with:
- **Username:** `PD`
- **Password:** `admin`

### 2. Start the Backend

```bash
cd backend
npm start
```

Server will run on `http://localhost:3000`

### 3. Start the Frontend

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📊 Application Architecture

### Backend (`/backend`)
- **Express.js** REST API
- **MongoDB Atlas** cloud database
- **JWT Authentication** with role-based access
- **bcrypt** for secure password hashing

#### API Endpoints

**User Routes** (`/api/users`):
- `POST /register` - Register new employee
- `POST /login` - Login and get JWT token
- `PUT /promote/:username` - Promote employee to PD (PD only)

**Fines Routes** (`/api/items`):
- `GET /` - Get fines (PD sees all, employees see only theirs)
- `GET /:id` - Get specific fine
- `POST /` - Create fine (PD only)
- `PUT /:id` - Update fine (PD only)
- `DELETE /:id` - Delete fine (PD only)

### Frontend (`/frontend`)
- **Vue 3** (Composition API)
- **Vite** for fast development
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Chart.js** for statistics visualization

#### Pages

- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New employee registration
- **Dashboard** (`/dashboard`) - Role-based dashboard
  - Employees: See their fines and stats
  - PD: See all fines, summary stats, and chart by category
- **Manage Fines** (`/fines`) - PD only, create/update/delete fines

---

## 👥 User Roles

### Employee
- Register account
- Login
- View their assigned fines on dashboard
- See fine details, status, and total amount owed

### Project Director (PD)
- All employee capabilities
- Access `/fines` management page
- Add new fines for employees
- Update fine status (pending/paid)
- Delete fines
- Promote employees to PD role
- View all fines across system
- See statistics and analytics

---

## 🎨 Design Features

- **Light, Clean Theme** - Consistent across all pages
- **Responsive Layout** - Works on desktop and mobile
- **Role-Based Navigation** - Different menu options per role
- **Toast Notifications** - Feedback on all actions
- **Data Visualization** - Chart showing fine distribution by category (PD only)

---

## 🔐 Security

- **JWT Authentication** - 8-hour token expiration
- **Password Hashing** - bcrypt with 10 rounds
- **Role-Based Access Control** - Server-side validation
- **Protected Routes** - Frontend route guards
- **CORS** - Configured for secure cross-origin requests
- **Environment Variables** - Sensitive data in `.env`

---

## 📝 Workflow Example

### For Employees

1. Go to `/register` → Create account
2. Login with credentials
3. On Dashboard → View all your assigned fines
4. See:
   - Total fines count
   - Total amount owed
   - Paid vs Pending breakdown
   - Individual fine details

### For Project Directors

1. Login with PD credentials
2. Navigate to Dashboard → See system overview
3. Go to "Manage Fines" → Add new fine
   - Enter employee name
   - Select category (Attendance, Late, Behavior, Other)
   - Set fine amount
   - Add description (optional)
4. View pending/paid status in the table
5. Mark fines as paid when received
6. Delete fines if needed
7. Promote trusted employees to PD

---

## 📦 Environment Files

Create `.env` in backend folder with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db-name
JWT_SECRET=your-secret-key
PORT=3000
```

Create `.env` in frontend folder with:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🧪 Testing Accounts

### Employee Account (Register New)
- Username: `employee1`
- Password: `test123456`

### PD Account (Pre-created)
- Username: `PD`
- Password: `admin`

**Note:** Change these credentials in production!

---

## 🚨 Common Issues

### "Cannot find mongooseConnect error"
- Ensure `MONGODB_URI` in `.env` is correct
- Check internet connection
- Verify MongoDB Atlas cluster is active

### "Port 3000 already in use"
- Change `PORT` in backend `.env`
- Or kill existing process: `lsof -ti:3000 | xargs kill`

### Fine not created error
- Verify you're logged in as PD
- Check required fields are filled
- Check browser console for specific error

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check Vite proxy in `vite.config.js`
- Verify no CORS issues

---

## 📚 File Structure

```
Fine-Collection-App/
├── backend/
│   ├── setupPD.js          # Create PD user
│   ├── index.js            # Main server
│   ├── server.js           # Alternative entry
│   ├── .env                # Environment config
│   ├── models/
│   │   ├── User.js
│   │   └── Item.js
│   ├── routes/
│   │   ├── users.js
│   │   └── items.js
│   ├── middleware/
│   │   └── auth.js
│   └── tests/
│       └── items.test.js
│
└── frontend/
    ├── src/
    │   ├── App.vue
    │   ├── main.js
    │   ├── components/
    │   │   ├── Navbar.vue
    │   │   └── NotificationCenter.vue
    │   ├── views/
    │   │   ├── login.vue
    │   │   ├── Register.vue
    │   │   ├── Dashboard.vue
    │   │   └── FinesList.vue
    │   ├── router/
    │   │   └── index.js
    │   ├── store/
    │   │   ├── auth.js
    │   │   ├── fines.js
    │   │   └── notifications.js
    │   └── assets/
    │       └── tailwind.css
    └── vite.config.js
```

---

## 🔄 Workflow Summary

```
User Registration → Login → View/Manage Fines Based on Role
                      ↓
                   Employee: Dashboard shows assigned fines
                      ↓
                   PD: Full management access + analytics
```

---

## 📞 Support Notes

- All API responses include proper error messages
- Notifications provide real-time feedback
- Dashboard updates automatically when fines change
- Charts update in real-time for PD view
- Mobile-responsive design works on all devices

---

**Refactored:** March 2026
**Last Updated:** March 9, 2026
