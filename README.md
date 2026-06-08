# 🚀 Backend API - Hệ thống Thi Trắc Nghiệm HSV QNU

Express REST API với PostgreSQL cho hệ thống thi trắc nghiệm.

## 📋 Yêu cầu

- Node.js >= 16.x
- npm >= 8.x
- PostgreSQL đã được cài đặt và database đã được tạo

## 🔧 Cài đặt

```bash
# Di chuyển vào thư mục backend
cd 2-backend

# Cài đặt dependencies
npm install
```

## ⚙️ Cấu hình

1. Tạo file `.env` từ `.env.example`:
```bash
copy .env.example .env
```

2. Chỉnh sửa file `.env` với thông tin database của bạn:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hsvqnu
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 🏃 Chạy ứng dụng

### Development mode (auto-reload)
```bash
npm run dev
```

### Production mode
```bash
# Build
npm run build

# Start
npm start
```

Backend API sẽ chạy trên: **http://localhost:3001**

## 📡 API Endpoints

### 🔐 Admin Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/admin/login` | Đăng nhập admin |

### 👥 Students Management
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/students` | Lấy danh sách sinh viên |
| PUT | `/api/students/:username` | Tạo/Cập nhật sinh viên |
| DELETE | `/api/students/:username` | Xóa sinh viên |

### 📚 Banks (Ngân hàng câu hỏi)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/banks` | Lấy danh sách banks |
| PUT | `/api/banks/:id` | Tạo/Cập nhật bank |
| DELETE | `/api/banks/:id` | Xóa bank |

### 📝 Exams Management
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/exams` | Lấy danh sách cuộc thi |
| PUT | `/api/exams/:id` | Tạo/Cập nhật cuộc thi |
| DELETE | `/api/exams/:id` | Xóa cuộc thi |

### ❓ Questions Management
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/questions` | Lấy danh sách câu hỏi |
| PUT | `/api/questions/:id` | Tạo/Cập nhật câu hỏi |
| DELETE | `/api/questions/:id` | Xóa câu hỏi |

### 📊 Submissions (Bài làm)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/submissions` | Lấy danh sách bài làm |
| PUT | `/api/submissions/:id` | Lưu bài làm |
| DELETE | `/api/submissions/:id` | Xóa bài làm |

### 🌐 Online Users
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/online_users` | Danh sách user online |
| PUT | `/api/online_users/:username` | Cập nhật trạng thái |
| DELETE | `/api/online_users/:username` | Xóa khỏi danh sách |

### ❤️ Health Check
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Kiểm tra server và database |

## 🗂️ Cấu trúc thư mục

```
2-backend/
├── src/
│   └── lib/
│       └── db.ts          # PostgreSQL connection pool
├── server.ts              # Express server & routes
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── .env                   # Environment variables (không commit)
├── .env.example           # Mẫu environment variables
└── README.md              # Tài liệu này
```

## 🔌 Database Connection

File `src/lib/db.ts` quản lý kết nối PostgreSQL:
- Sử dụng **pg Pool** để tối ưu performance
- Auto-reconnect khi mất kết nối
- Query helpers: `query()`, `queryOne()`

## 🧪 Test API

### Sử dụng curl
```bash
# Health check
curl http://localhost:3001/api/health

# Get students
curl http://localhost:3001/api/students

# Admin login
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Sử dụng Postman
1. Import collection
2. Set base URL: `http://localhost:3001`
3. Test các endpoints

## 🐛 Troubleshooting

### Lỗi kết nối database
```
Error: connect ECONNREFUSED
```
**Giải pháp**: 
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin trong file `.env`
- Test connection: `psql -U postgres -d hsvqnu`

### Lỗi "database does not exist"
```
Error: database "hsvqnu" does not exist
```
**Giải pháp**: 
- Chạy scripts trong `1-database/` để tạo database

### Port 3001 đã được sử dụng
```
Error: listen EADDRINUSE :::3001
```
**Giải pháp**: 
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### CORS Error từ Frontend
**Giải pháp**: 
- Kiểm tra `FRONTEND_URL` trong `.env`
- Thêm CORS middleware nếu chưa có

## 🔒 Security

- ✅ Input validation cho tất cả endpoints
- ✅ SQL injection protection (parameterized queries)
- ✅ Password hashing (cần implement bcrypt)
- ⚠️ Thêm JWT authentication cho production
- ⚠️ Rate limiting cho API endpoints
- ⚠️ HTTPS cho production

## 📦 Deploy

### Heroku
```bash
# Login
heroku login

# Create app
heroku create hsvqnu-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

### Railway
```bash
# Install Railway CLI
npm install -g railway

# Login and deploy
railway login
railway init
railway up
```

### VPS (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and setup
git clone <repo>
cd 2-backend
npm install
npm run build

# PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name hsvqnu-backend
pm2 startup
pm2 save
```

## 📊 Performance Tips

1. **Connection Pooling**: Đã config trong `db.ts`
2. **Indexes**: Database đã có indexes cho các trường thường query
3. **Caching**: Consider Redis cho data không thay đổi thường xuyên
4. **Rate Limiting**: Implement express-rate-limit
5. **Compression**: Add compression middleware

## 📚 Dependencies

### Production
- **express**: Web framework
- **pg**: PostgreSQL client
- **dotenv**: Environment variables
- **cors**: CORS middleware

### Development
- **tsx**: TypeScript executor
- **typescript**: TypeScript compiler
- **@types/***: Type definitions

## 🎯 Roadmap

- [ ] Thêm JWT authentication
- [ ] Implement WebSocket cho real-time updates
- [ ] Add request logging (morgan)
- [ ] Add API documentation (Swagger)
- [ ] Add unit tests (Jest)
- [ ] Add rate limiting
- [ ] Add request validation (joi/zod)
- [ ] Add API versioning

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trong console
2. Verify database connection
3. Test với curl/Postman
4. Check firewall settings

## 📖 Tài liệu tham khảo

- Express.js: https://expressjs.com/
- node-postgres: https://node-postgres.com/
- TypeScript: https://www.typescriptlang.org/
