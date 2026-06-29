# LCU Timetable — Backend

Complete backend for the LCU Timetable System.

**Stack:** Node.js · Express · PostgreSQL · Prisma · JWT · bcrypt · Zod · Helmet · CORS · Rate-limit

---

## 1. Folder structure

```
lcu-backend/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.js              # Demo data + accounts
├── src/
│   ├── server.js            # Express entry point
│   ├── config/
│   │   └── prisma.js        # Prisma client singleton
│   ├── controllers/         # Business logic per resource
│   ├── routes/              # URL → controller mapping
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT + role guard
│   │   ├── validate.middleware.js # Zod runner
│   │   └── error.middleware.js    # 404 + central errors
│   ├── validators/schemas.js
│   └── utils/
│       ├── jwt.js
│       └── response.js      # ok() / fail() / asyncHandler()
├── .env.example
├── package.json
└── README.md
```

## 2. Local setup (Windows / Mac / Linux)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a free hosted DB from Neon / Supabase / Railway)

### Steps

```bash
# 1. Install dependencies
cd lcu-backend
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env and set DATABASE_URL + JWT_SECRET

# 3. Create the database tables
npx prisma migrate dev --name init

# 4. Seed demo data (departments, courses, rooms, 3 demo accounts)
npm run seed

# 5. Run the dev server
npm run dev
# → http://localhost:5000
```

**Demo accounts** (password for all: `password123`):

| Role     | loginId            |
|----------|--------------------|
| Admin    | `admin`            |
| Lecturer | `LCU/SE/001`       |
| Student  | `LCU/SE/2021/001`  |

---

## 3. Standard response shape

Every endpoint returns:

```json
{ "success": true, "message": "Operation successful", "data": { } }
```

On error:

```json
{ "success": false, "message": "Why it failed" }
```

---

## 4. API endpoints

All protected routes require: `Authorization: Bearer <token>`

### Auth (`/api/auth`)
| Method | Path        | Body                                    | Role   |
|--------|-------------|------------------------------------------|--------|
| POST   | `/register` | loginId, name, email, password, role…   | public |
| POST   | `/login`    | loginId, password, role?                | public |
| GET    | `/me`       | —                                        | any    |

### Courses (`/api/courses`)
| GET `/` · GET `/:id` (any) · POST/PUT/DELETE (ADMIN) |

### Lecturers (`/api/lecturers`)
| GET `/` · GET `/:id` (any) · PUT `/:id/courses` · DELETE (ADMIN) |

### Rooms (`/api/rooms`) — same pattern as courses.
### Departments (`/api/departments`) — same pattern.
### Users (`/api/users`) — ADMIN only.

### Schedules (`/api/schedules`)
| Method | Path         | Notes                                      |
|--------|--------------|--------------------------------------------|
| GET    | `/`          | filters: `?lecturerId=`, `?department=`, `?level=`, `?studentId=` |
| POST   | `/generate`  | ADMIN — runs the placement algorithm       |
| DELETE | `/all`       | ADMIN — clear all schedules                |
| DELETE | `/:id`       | ADMIN                                      |

---

## 5. Connecting your React frontend

Create `src/api.js` in your frontend:

```js
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

export const api = {
  login: (loginId, password, role) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ loginId, password, role }) }),
  me: () => request("/auth/me"),
  courses: () => request("/courses"),
  lecturers: () => request("/lecturers"),
  rooms: () => request("/rooms"),
  schedules: (filters = "") => request(`/schedules${filters}`),
  generate: () => request("/schedules/generate", { method: "POST" }),
};
```

### Replace the mock LoginPage logic

```jsx
const handleLogin = async () => {
  setLoading(true); setError("");
  try {
    const { user, token } = await api.login(id, pass, role.toUpperCase());
    localStorage.setItem("token", token);
    onLogin(user);
  } catch (e) { setError(e.message); }
  finally { setLoading(false); }
};
```

### Replace mock data hooks

```jsx
const [courses, setCourses] = useState([]);
const [lecturers, setLecturers] = useState([]);
const [rooms, setRooms] = useState([]);
const [timetable, setTimetable] = useState([]);

useEffect(() => {
  (async () => {
    const [{ courses }, { lecturers }, { rooms }, { schedules }] = await Promise.all([
      api.courses(), api.lecturers(), api.rooms(), api.schedules(),
    ]);
    setCourses(courses); setLecturers(lecturers);
    setRooms(rooms); setTimetable(schedules);
  })();
}, []);
```

### Generate timetable button

```jsx
const handleGenerate = async () => {
  const { schedules } = await api.generate();
  setTimetable(schedules);
};
```

Add to frontend `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Security checklist (already wired)

- ✅ `helmet()` — secure HTTP headers
- ✅ `cors({ origin: CLIENT_URL })` — only your frontend can call
- ✅ `express-rate-limit` — 200 req / 15 min globally, 20 / 15 min on `/auth`
- ✅ `bcrypt` — password hashing (10 rounds)
- ✅ JWT auth with `Authorization: Bearer …`
- ✅ Zod input validation on every write route
- ✅ Prisma — parameterized queries protect against SQL injection
- ✅ Role-based access control via `authorize("ADMIN")`

---

## 7. Deployment

### A. Railway (easiest)
1. Push this folder to GitHub.
2. Go to <https://railway.app> → **New Project → Deploy from GitHub**.
3. Add a **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`.
4. In **Variables** add: `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
5. In **Settings → Deploy → Start Command**:
   `npx prisma migrate deploy && node src/server.js`

### B. Render
1. New → **Web Service** → connect repo.
2. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Start Command: `node src/server.js`
4. Add a **Render PostgreSQL** DB; copy its Internal URL into `DATABASE_URL`.
5. Add `JWT_SECRET` and `CLIENT_URL` env vars.

### C. VPS (Ubuntu)
```bash
# install node 20 + postgres
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql

# create db
sudo -u postgres createdb lcu_timetable

# clone, install, build
git clone <your-repo> && cd lcu-backend
npm install
cp .env.example .env   # edit with your values
npx prisma migrate deploy
npm run seed

# run with pm2
sudo npm i -g pm2
pm2 start src/server.js --name lcu-backend
pm2 startup && pm2 save
```

Put nginx in front of it as a reverse proxy on port 80/443 and add a Let's Encrypt cert with `certbot`.

---

## 8. Common errors

| Error | Fix |
|-------|------|
| `Environment variable not found: DATABASE_URL` | `.env` missing or not in the same folder as `package.json` |
| `Can't reach database server` | Postgres not running, wrong port, wrong password |
| `JsonWebTokenError: invalid signature` | Different `JWT_SECRET` than the one used to sign the token — clear localStorage and log in again |
| CORS error in browser | Set `CLIENT_URL` in `.env` to exactly match your frontend URL (no trailing slash) |
