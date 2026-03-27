# LinkCube Backend API — Developer README

> **Stack:** Node.js · Express.js · MongoDB (Mongoose) · express-session + JWT · Multer · Groq + Llama 3 (RAG)
>
> **Base URL:** `http://localhost:3000` (dev) | `https://<your-domain>` (prod)
>
> **Frontend expectation:** React (Vite), port `5173`

---

## Table of Contents

1. [Project API Overview](#1-project-api-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [Route-by-Route Backend Documentation](#3-route-by-route-backend-documentation)
   - [User / Auth Routes](#31-user--auth-routes-apuser)
   - [File Routes](#32-file-routes-apifiles)
   - [Task Routes](#33-task-routes-apitasks)
   - [Chat Routes](#34-chat-routes-apichat)
   - [RAG Routes](#35-rag-routes-apirag)
4. [Frontend Implementation Plan by Feature](#4-frontend-implementation-plan-by-feature)
   - [Authentication & User Module](#41-authentication--user-module)
   - [File Upload & Management Module](#42-file-upload--management-module)
   - [Task Management Module (NGO)](#43-task-management-module-ngo)
   - [Volunteer Task Dashboard Module](#44-volunteer-task-dashboard-module)
   - [Chat with Documents Module (RAG Chat)](#45-chat-with-documents-module-rag-chat)
   - [Direct RAG Query Module](#46-direct-rag-query-module)
5. [Suggested Frontend Folder & Service Organization](#5-suggested-frontend-folder--service-organization)
6. [Edge Cases & Integration Notes](#6-edge-cases--integration-notes)

---

## 1. Project API Overview

LinkCube is a volunteer-NGO coordination platform with in-built AI capabilities. It connects NGOs with volunteers, allowing task creation and assignment, file management, and AI-powered document Q&A (RAG).

### Core Modules

| Module        | Base Path      | Purpose                                                                  |
| ------------- | -------------- | ------------------------------------------------------------------------ |
| Auth / User   | `/api/user`    | Register, login, logout, get current user                                |
| Files         | `/api/files`   | Upload documents (PDF/image), retrieve by location or volunteer          |
| Tasks         | `/api/tasks`   | NGO creates and manages tasks; volunteers view assigned tasks             |
| Chat          | `/api/chat`    | Session-based RAG chat — full conversational document Q&A                |
| RAG (direct)  | `/api/rag`     | Stateless document Q&A without a session/chat context                    |

### User Roles

| Role        | Capabilities                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `volunteer` | Upload files, view tasks assigned to them, chat with documents, query RAG directly                |
| `ngo`       | Create tasks, assign/remove volunteers, mark tasks complete, view volunteer matches, upload files  |
| `admin`     | (role reserved — no admin-specific routes implemented yet)                                         |

### Authentication Model

- Session-based (express-session) + JWT stored **inside** the session.
- The frontend must send requests **with credentials** (`credentials: 'include'` in fetch / `withCredentials: true` in axios).
- The session cookie is `connect.sid`.

---

## 2. Authentication Flow

### How it Works

1. Client calls `POST /api/user/login` or `POST /api/user/register`.
2. Server validates credentials, creates a JWT, and stores **both** `req.session.token` and `req.session.user`.
3. Client receives the JWT in the JSON body **and** a `connect.sid` session cookie.
4. On every subsequent request, the browser automatically sends the cookie; the `isLoggedIn` middleware reads `req.session.user` to gate access.
5. The JWT in the response body can also be stored in memory/localStorage for SSR or mobile use.

### `isLoggedIn` Middleware (applied to all protected routes)

```js
// Checks: req.session.user exists
// On failure: 401 Unauthorized
```

### `isVolunteer` Middleware

```js
// Checks: req.session.user.role === "volunteer"
// On failure: 403 Forbidden
```

### `isNGO` Middleware

```js
// Checks: req.session.user.role === "ngo"
// On failure: 403 Forbidden
```

### Frontend Auth Handling Pattern

```js
// axios instance (src/services/api.js)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,        // REQUIRED — sends session cookie
});

// Response interceptor: redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## 3. Route-by-Route Backend Documentation

### 3.1 User / Auth Routes — `/api/user`

---

#### `POST /api/user/register`

Register a new user (volunteer or NGO).

**Auth required:** ❌ None

**Request Body:**

| Field          | Type      | Required | Description                                          |
| -------------- | --------- | -------- | ---------------------------------------------------- |
| `name`         | `string`  | ✅        | Full name                                            |
| `email`        | `string`  | ✅        | Unique email address                                 |
| `password`     | `string`  | ✅        | Min 6 characters                                     |
| `role`         | `string`  | ✅        | `"volunteer"` or `"ngo"`                             |
| `skills`       | `string[]`| ❌        | e.g. `["teaching", "medical"]` (volunteer)           |
| `location`     | `string`  | ❌        | City or region                                       |
| `availability` | `boolean` | ❌        | Default: `true`                                      |

**Example Request:**

```json
POST /api/user/register
{
  "name": "Riya Sharma",
  "email": "riya@example.com",
  "password": "secure123",
  "role": "volunteer",
  "skills": ["teaching", "first-aid"],
  "location": "Mumbai",
  "availability": true
}
```

**Example Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": {
    "_id": "664abc...",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "role": "volunteer"
  }
}
```

**Error Cases:**

| Status | Condition                         |
| ------ | --------------------------------- |
| 400    | Email already registered          |
| 400    | Missing required fields           |
| 400    | Password shorter than 6 chars     |

---

#### `POST /api/user/login`

Authenticate an existing user.

**Auth required:** ❌ None

**Request Body:**

| Field      | Type     | Required | Description |
| ---------- | -------- | -------- | ----------- |
| `email`    | `string` | ✅        |             |
| `password` | `string` | ✅        |             |

**Example Request:**

```json
POST /api/user/login
{
  "email": "riya@example.com",
  "password": "secure123"
}
```

**Example Response (200):**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "<jwt>",
  "user": {
    "_id": "664abc...",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "role": "volunteer"
  }
}
```

**Error Cases:**

| Status | Condition                               |
| ------ | --------------------------------------- |
| 400    | Email or password missing               |
| 401    | Invalid email or password               |

---

#### `POST /api/user/logout`

Destroy the session and clear the cookie.

**Auth required:** ✅ `isLoggedIn`

**Request Body:** None

**Example Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### `GET /api/user/me`

Fetch the currently authenticated user from the session.

**Auth required:** ✅ `isLoggedIn`

**Example Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "664abc...",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "role": "volunteer",
    "skills": ["teaching"],
    "location": "Mumbai",
    "availability": true
  }
}
```

> **Note:** Returns whatever is stored in `req.session.user`. The session is updated on login. If you update a user's profile in future, re-login or implement a session refresh to see updated data.

---

### 3.2 File Routes — `/api/files`

All file routes require authentication. Upload routes additionally require the `volunteer` or `ngo` role (via `isVolunteer`).

> Files are served statically at `/uploads/<storedName>`.

---

#### `POST /api/files/upload`

Upload a single file. Triggers asynchronous AI ingestion (text extraction + embedding).

**Auth required:** ✅ `isLoggedIn` + `isVolunteer`

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field      | Type     | Required | Description                          |
| ---------- | -------- | -------- | ------------------------------------ |
| `file`     | File     | ✅        | The file to upload (PDF recommended) |
| `location` | `string` | ❌        | Location tag for the file            |

**Example Response (201):**

```json
{
  "success": true,
  "message": "File uploaded successfully. Ingestion started.",
  "data": {
    "_id": "665def...",
    "originalName": "report.pdf",
    "storedName": "1717000000000-report.pdf",
    "filePath": "uploads/1717000000000-report.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "uploadedBy": "664abc...",
    "status": "uploaded",
    "embeddingStatus": "not_started",
    "metadata": { "location": "Delhi" },
    "createdAt": "2024-05-29T10:00:00.000Z"
  }
}
```

**File Ingestion Pipeline Status Values:**

| `status` value    | Meaning                              |
| ----------------- | ------------------------------------ |
| `uploaded`        | File saved to disk, ingestion queued |
| `extracting_text` | Text extraction in progress          |
| `chunking`        | Splitting into chunks                |
| `embedding`       | Generating vector embeddings         |
| `ready`           | File is searchable via RAG           |
| `failed`          | Ingestion failed — see `failureReason` |

---

#### `POST /api/files/upload-multiple`

Upload multiple files in one request.

**Auth required:** ✅ `isLoggedIn` + `isVolunteer`

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field      | Type     | Required | Description                   |
| ---------- | -------- | -------- | ----------------------------- |
| `files`    | File[]   | ✅        | Multiple files (use same field name) |
| `location` | `string` | ❌        | Applied to all uploaded files |

**Example Response (201):**

```json
{
  "success": true,
  "message": "3 file(s) uploaded successfully. Ingestion started.",
  "data": [ /* array of File documents */ ]
}
```

---

#### `GET /api/files/location/:location`

Fetch all files tagged with a specific location.

**Auth required:** ✅ `isLoggedIn`

**URL Params:**

| Param      | Description                  |
| ---------- | ---------------------------- |
| `location` | Location string, e.g. `Delhi` |

**Example Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [ /* array of File documents */ ]
}
```

---

#### `GET /api/files/my-uploads`

Fetch all files uploaded by the currently logged-in volunteer.

**Auth required:** ✅ `isLoggedIn` + `isVolunteer`

**Example Response (200):**

```json
{
  "success": true,
  "count": 5,
  "data": [ /* array of File documents */ ]
}
```

---

#### `GET /api/files/:id`

Fetch a single file record by its MongoDB `_id`.

**Auth required:** ✅ `isLoggedIn`

**URL Params:**

| Param | Description     |
| ----- | --------------- |
| `id`  | File document ID |

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665def...",
    "originalName": "report.pdf",
    "status": "ready",
    "embeddingStatus": "completed",
    "chunkCount": 12,
    "metadata": { "location": "Delhi" }
  }
}
```

**Error Cases:**

| Status | Condition         |
| ------ | ----------------- |
| 404    | File not found    |

---

### 3.3 Task Routes — `/api/tasks`

---

#### `POST /api/tasks`

NGO creates a new task.

**Auth required:** ✅ `isLoggedIn` + `isNGO`

**Request Body:**

| Field           | Type       | Required | Description                                         |
| --------------- | ---------- | -------- | --------------------------------------------------- |
| `title`         | `string`   | ✅        | Short title of the task                             |
| `description`   | `string`   | ✅        | Detailed description                                |
| `category`      | `string`   | ❌        | e.g. `"Medical"`, `"Education"`                     |
| `priority`      | `string`   | ❌        | `"low"`, `"medium"` (default), `"high"`, `"critical"` |
| `location`      | `string`   | ❌        | City or region                                      |
| `requiredSkills`| `string[]` | ❌        | Skills needed e.g. `["teaching"]`                   |
| `sourceFileId`  | `string`   | ❌        | MongoDB ObjectId of a file that generated this task |

**Example Request:**

```json
POST /api/tasks
{
  "title": "Medical camp at shelter",
  "description": "Need volunteers to assist with medical check-up at the Mumbai shelter.",
  "category": "Medical",
  "priority": "high",
  "location": "Mumbai",
  "requiredSkills": ["first-aid", "medical"]
}
```

**Example Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "666task...",
    "title": "Medical camp at shelter",
    "description": "...",
    "category": "Medical",
    "priority": "high",
    "location": "Mumbai",
    "requiredSkills": ["first-aid", "medical"],
    "status": "open",
    "ngoId": "664ngo...",
    "assignedVolunteers": [],
    "sourceFileId": null,
    "completedAt": null,
    "createdAt": "2024-05-29T10:00:00.000Z"
  }
}
```

---

#### `GET /api/tasks/my`

NGO fetches all tasks they created (with assigned volunteers populated).

**Auth required:** ✅ `isLoggedIn` + `isNGO`

**Example Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "666task...",
      "title": "Medical camp at shelter",
      "status": "in_progress",
      "assignedVolunteers": [
        {
          "_id": "664vol...",
          "name": "Riya Sharma",
          "email": "riya@example.com",
          "skills": ["first-aid"],
          "location": "Mumbai"
        }
      ]
    }
  ]
}
```

---

#### `GET /api/tasks/assigned/me`

Volunteer fetches all tasks assigned to them (with NGO info populated).

**Auth required:** ✅ `isLoggedIn`

**Example Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "666task...",
      "title": "Medical camp at shelter",
      "status": "in_progress",
      "ngoId": {
        "_id": "664ngo...",
        "name": "Helping Hands NGO",
        "email": "admin@helpinghands.org"
      }
    }
  ]
}
```

---

#### `GET /api/tasks/:taskId`

Fetch a single task by ID. Available to any authenticated user.

**Auth required:** ✅ `isLoggedIn`

**URL Params:**

| Param    | Description  |
| -------- | ------------ |
| `taskId` | Task ObjectId |

**Example Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "666task...",
    "title": "Medical camp at shelter",
    "ngoId": { "_id": "664ngo...", "name": "Helping Hands NGO", "email": "admin@helpinghands.org" },
    "assignedVolunteers": [
      { "_id": "664vol...", "name": "Riya", "skills": ["first-aid"], "availability": false }
    ],
    "status": "in_progress"
  }
}
```

---

#### `GET /api/tasks/:taskId/matches`

NGO gets a list of available, skill-matched volunteers for a specific task.

**Auth required:** ✅ `isLoggedIn` + `isNGO` (task must belong to this NGO)

**URL Params:**

| Param    | Description  |
| -------- | ------------ |
| `taskId` | Task ObjectId |

**Example Response (200):**

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "664vol...",
      "name": "Riya Sharma",
      "email": "riya@example.com",
      "skills": ["first-aid", "medical"],
      "location": "Mumbai",
      "availability": true,
      "skillMatch": true
    }
  ]
}
```

> **`skillMatch: true`** means the volunteer has at least one skill that matches `task.requiredSkills`.

---

#### `PATCH /api/tasks/:taskId/assign/:volunteerId`

NGO assigns a volunteer to a task. Sets volunteer's `availability = false` and task status to `"in_progress"`.

**Auth required:** ✅ `isLoggedIn` + `isNGO` (must own the task)

**URL Params:**

| Param         | Description       |
| ------------- | ----------------- |
| `taskId`      | Task ObjectId     |
| `volunteerId` | User ObjectId     |

**Request Body:** None

**Example Response (200):**

```json
{
  "success": true,
  "message": "Riya Sharma assigned successfully.",
  "data": { /* updated task */ }
}
```

**Error Cases:**

| Status | Condition                                    |
| ------ | -------------------------------------------- |
| 404    | Task or volunteer not found                   |
| 403    | NGO does not own the task                     |
| 400    | Task is completed or cancelled                |
| 400    | User is not a volunteer                       |
| 400    | Volunteer is currently unavailable            |
| 400    | Volunteer already assigned to this task       |

---

#### `PATCH /api/tasks/:taskId/remove/:volunteerId`

NGO removes a volunteer from a task. Restores volunteer's `availability = true`.

**Auth required:** ✅ `isLoggedIn` + `isNGO` (must own the task)

**URL Params:**

| Param         | Description       |
| ------------- | ----------------- |
| `taskId`      | Task ObjectId     |
| `volunteerId` | User ObjectId     |

**Example Response (200):**

```json
{
  "success": true,
  "message": "Riya Sharma removed from task.",
  "data": { /* updated task */ }
}
```

---

#### `PATCH /api/tasks/:taskId/complete`

NGO marks a task as completed. Frees all assigned volunteers (`availability = true`).

**Auth required:** ✅ `isLoggedIn` + `isNGO` (must own the task)

**Example Response (200):**

```json
{
  "success": true,
  "message": "Task marked as completed. Volunteers are now available.",
  "data": { /* completed task with completedAt timestamp */ }
}
```

**Error Cases:**

| Status | Condition                         |
| ------ | --------------------------------- |
| 400    | Task is already completed         |
| 400    | Task is cancelled                 |

---

### 3.4 Chat Routes — `/api/chat`

All chat routes require `isLoggedIn`. The chat system is a session-based RAG interface — each chat holds a conversation history and optional file scope.

---

#### `POST /api/chat`

Create a new chat session.

**Auth required:** ✅ `isLoggedIn`

**Request Body:**

| Field     | Type       | Required | Description                                                     |
| --------- | ---------- | -------- | --------------------------------------------------------------- |
| `title`   | `string`   | ❌        | Chat title. Defaults to `"New Chat"` (auto-titled on first message) |
| `fileIds` | `string[]` | ❌        | File ObjectIds to scope RAG to. Empty = search all user files    |

**Example Request:**

```json
POST /api/chat
{
  "title": "Delhi Flood Report Analysis",
  "fileIds": ["665def..."]
}
```

**Example Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "667chat...",
    "userId": "664abc...",
    "title": "Delhi Flood Report Analysis",
    "fileIds": ["665def..."],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

#### `GET /api/chat`

Fetch all chats for the logged-in user, sorted by most recent.

**Auth required:** ✅ `isLoggedIn`

**Example Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    { "_id": "667chat...", "title": "Delhi Flood Report Analysis", "fileIds": [...], "updatedAt": "..." }
  ]
}
```

---

#### `GET /api/chat/:chatId/messages`

Fetch all messages for a chat (chronological order).

**Auth required:** ✅ `isLoggedIn` (must own the chat)

**URL Params:**

| Param    | Description  |
| -------- | ------------ |
| `chatId` | Chat ObjectId |

**Example Response (200):**

```json
{
  "success": true,
  "count": 4,
  "data": [
    { "_id": "...", "chatId": "667chat...", "role": "user", "content": "What happened in Delhi floods?" },
    {
      "_id": "...",
      "chatId": "667chat...",
      "role": "assistant",
      "content": "Based on the uploaded reports, the Delhi floods of...",
      "sources": [
        {
          "fileId": "665def...",
          "fileName": "delhi_report.pdf",
          "chunkIndex": 3,
          "preview": "...500 families displaced near...",
          "score": 0.91
        }
      ]
    }
  ]
}
```

---

#### `POST /api/chat/:chatId/message`

Send a question to a chat session and receive a RAG-grounded answer.

**Auth required:** ✅ `isLoggedIn` (must own the chat)

**URL Params:**

| Param    | Description  |
| -------- | ------------ |
| `chatId` | Chat ObjectId |

**Request Body:**

| Field      | Type     | Required | Description          |
| ---------- | -------- | -------- | -------------------- |
| `question` | `string` | ✅        | User's question text |

**Example Request:**

```json
POST /api/chat/667chat.../message
{
  "question": "How many people were affected by the flood?"
}
```

**Example Response (200):**

```json
{
  "success": true,
  "answer": "According to the uploaded report, approximately 2,300 people were affected across 5 districts.",
  "sources": [
    {
      "fileId": "665def...",
      "fileName": "delhi_report.pdf",
      "chunkIndex": 7,
      "preview": "...2,300 people across 5 districts...",
      "score": 0.94
    }
  ],
  "messageId": "668msg...",
  "chatId": "667chat...",
  "chatTitle": "How many people were affected by the flood?"
}
```

> **Note:** If this is the first message in the chat, the chat title will be auto-set to the first 60 characters of the question.

---

#### `DELETE /api/chat/:chatId`

Delete a chat session and all its messages.

**Auth required:** ✅ `isLoggedIn` (must own the chat)

**Example Response (200):**

```json
{
  "success": true,
  "message": "Chat deleted."
}
```

---

> **⚠️ Planned Route (Not Yet in Router):** `PATCH /api/chat/:chatId` — Rename a chat. The controller function `renameChat` is implemented but **not registered** in `chatRoutes.js`. Add it when frontend needs it:
>
> ```js
> router.patch('/:chatId', renameChat);
> ```
>
> **Request body:** `{ "title": "New Chat Title" }`

---

### 3.5 RAG Routes — `/api/rag`

Stateless document Q&A. No conversation history — use `/api/chat` for context-aware Q&A.

---

#### `POST /api/rag/ask`

Ask a question across all (or specified) files uploaded by the user.

**Auth required:** ✅ `isLoggedIn`

**Request Body:**

| Field      | Type       | Required | Description                                               |
| ---------- | ---------- | -------- | --------------------------------------------------------- |
| `question` | `string`   | ✅        | The user's question                                       |
| `fileIds`  | `string[]` | ❌        | Scope to specific file IDs. Empty = search all user files |

**Example Request:**

```json
POST /api/rag/ask
{
  "question": "What are the main risks in the flood-affected areas?",
  "fileIds": ["665def..."]
}
```

**Example Response (200):**

```json
{
  "success": true,
  "answer": "The main risks include waterborne diseases, displacement, and infrastructure damage as mentioned in section 4 of the report.",
  "sources": [
    {
      "fileId": "665def...",
      "fileName": "delhi_report.pdf",
      "chunkIndex": 4,
      "preview": "...waterborne diseases and infrastructure...",
      "score": 0.89
    }
  ]
}
```

---

#### `POST /api/rag/ask-file/:fileId`

Ask a question scoped to a single specific file.

**Auth required:** ✅ `isLoggedIn`

**URL Params:**

| Param    | Description  |
| -------- | ------------ |
| `fileId` | File ObjectId |

**Request Body:**

| Field      | Type     | Required | Description         |
| ---------- | -------- | -------- | ------------------- |
| `question` | `string` | ✅        | The user's question |

**Example Response (200):** Same structure as `/api/rag/ask`.

---

## 4. Frontend Implementation Plan by Feature

---

### 4.1 Authentication & User Module

**Routes used:**
- `POST /api/user/register`
- `POST /api/user/login`
- `POST /api/user/logout`
- `GET /api/user/me`

**Pages / Components:**
- `/register` — `RegisterPage.jsx`
- `/login` — `LoginPage.jsx`
- `AuthContext` / `useAuth` hook — global auth state

**When to Call:**

| Event                  | Route                     |
| ---------------------- | ------------------------- |
| Form submit on register | `POST /api/user/register` |
| Form submit on login    | `POST /api/user/login`    |
| App mount (check session)| `GET /api/user/me`       |
| Logout button click     | `POST /api/user/logout`   |

**Payload Examples:**

```js
// register
api.post('/api/user/register', {
  name, email, password, role, skills, location, availability
});

// login
api.post('/api/user/login', { email, password });
```

**State Management:**

```jsx
// context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app boot, check session
  useEffect(() => {
    api.get('/api/user/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/user/login', { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post('/api/user/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Loading / Error Handling:**

- Show a spinner while `loading === true` on app boot.
- On form submit: disable the submit button and show inline error.
- Store `user` from the auth response (do NOT rely on localStorage for session — cookie handles it).
- `role` from the user object drives what UI is shown.

**Protected Route Component:**

```jsx
// components/ProtectedRoute.jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
};
```

---

### 4.2 File Upload & Management Module

**Routes used:**
- `POST /api/files/upload`
- `POST /api/files/upload-multiple`
- `GET /api/files/my-uploads`
- `GET /api/files/location/:location`
- `GET /api/files/:id`

**Pages / Components:**
- `FileUploadPage.jsx` (Volunteer)
- `FileList.jsx`
- `FileCard.jsx`
- `IngestionStatusBadge.jsx`

**When to Call:**

| Event                          | Route                               |
| ------------------------------ | ----------------------------------- |
| Upload form submission          | `POST /api/files/upload`            |
| Multi-file form submission      | `POST /api/files/upload-multiple`   |
| Volunteer visits "My Uploads"   | `GET /api/files/my-uploads`         |
| Filter files by location        | `GET /api/files/location/:location` |
| View a file's details / status  | `GET /api/files/:id`                |

**Upload with `FormData` (IMPORTANT — don't use JSON):**

```js
// services/fileService.js
export const uploadFile = (file, location) => {
  const formData = new FormData();
  formData.append('file', file);        // field name must be 'file'
  if (location) formData.append('location', location);
  return api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadMultipleFiles = (files, location) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f)); // field name must be 'files'
  if (location) formData.append('location', location);
  return api.post('/api/files/upload-multiple', formData);
};
```

**Ingestion Status Polling:**

After upload, the file status will be `"uploaded"` and then progress to `"ready"` asynchronously. Poll the file status using `GET /api/files/:id` every 3–5 seconds until `status === "ready"`:

```js
// hooks/useFileStatus.js
const useFileStatus = (fileId) => {
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!fileId) return;
    const interval = setInterval(async () => {
      const res = await api.get(`/api/files/${fileId}`);
      setFile(res.data.data);
      if (['ready', 'failed'].includes(res.data.data.status)) {
        clearInterval(interval);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fileId]);

  return file;
};
```

**Status Badge UI:**

| `status`          | Badge Color | Label              |
| ----------------- | ----------- | ------------------ |
| `uploaded`        | Gray        | Queued             |
| `extracting_text` | Blue        | Extracting text... |
| `chunking`        | Blue        | Chunking...        |
| `embedding`       | Purple      | Embedding...       |
| `ready`           | Green       | Ready              |
| `failed`          | Red         | Failed             |

---

### 4.3 Task Management Module (NGO)

**Routes used:**
- `POST /api/tasks`
- `GET /api/tasks/my`
- `GET /api/tasks/:taskId`
- `GET /api/tasks/:taskId/matches`
- `PATCH /api/tasks/:taskId/assign/:volunteerId`
- `PATCH /api/tasks/:taskId/remove/:volunteerId`
- `PATCH /api/tasks/:taskId/complete`

**Pages / Components:**
- `NGODashboard.jsx` — lists `/api/tasks/my`
- `CreateTaskModal.jsx` — form for task creation
- `TaskDetailPage.jsx` — single task view
- `VolunteerMatchList.jsx` — matched volunteers for a task

**When to Call:**

| Event                         | Route                                         |
| ----------------------------- | --------------------------------------------- |
| NGO dashboard mounts          | `GET /api/tasks/my`                           |
| Create task form submit        | `POST /api/tasks`                             |
| Click on a task card           | `GET /api/tasks/:taskId`                      |
| Open "Find Volunteers" panel   | `GET /api/tasks/:taskId/matches`              |
| Click "Assign" on a volunteer  | `PATCH /api/tasks/:taskId/assign/:volunteerId`|
| Click "Remove" on a volunteer  | `PATCH /api/tasks/:taskId/remove/:volunteerId`|
| Click "Mark Complete"          | `PATCH /api/tasks/:taskId/complete`           |

**Suggested Service:**

```js
// services/taskService.js
export const createTask = (data) => api.post('/api/tasks', data);
export const getMyTasks = () => api.get('/api/tasks/my');
export const getTaskById = (taskId) => api.get(`/api/tasks/${taskId}`);
export const getMatches = (taskId) => api.get(`/api/tasks/${taskId}/matches`);
export const assignVolunteer = (taskId, volunteerId) =>
  api.patch(`/api/tasks/${taskId}/assign/${volunteerId}`);
export const removeVolunteer = (taskId, volunteerId) =>
  api.patch(`/api/tasks/${taskId}/remove/${volunteerId}`);
export const completeTask = (taskId) => api.patch(`/api/tasks/${taskId}/complete`);
```

**Suggested Component Structure for `TaskDetailPage`:**

```
TaskDetailPage
├── TaskHeader (title, status badge, priority badge)
├── TaskInfo (description, category, location, skills)
├── AssignedVolunteersList
│   └── VolunteerChip (name, email, skills, remove button)
├── VolunteerMatchSection
│   ├── Button "Find Matching Volunteers" → calls GET matches
│   └── VolunteerMatchList
│       └── VolunteerCard (name, skills, skillMatch badge, assign button)
└── CompleteTaskButton
```

**State handling for assign/remove:**

- After assigning or removing, refetch `GET /api/tasks/:taskId` to update the UI.
- Show a spinner on the assign/remove button while the PATCH request is in-flight.
- Surface errors inline (e.g., "Volunteer is currently unavailable").

---

### 4.4 Volunteer Task Dashboard Module

**Routes used:**
- `GET /api/tasks/assigned/me`
- `GET /api/tasks/:taskId`

**Pages / Components:**
- `VolunteerDashboard.jsx`
- `AssignedTaskCard.jsx`
- `TaskDetailPage.jsx` (shared with NGO view, but without edit actions)

**When to Call:**

| Event                        | Route                     |
| ---------------------------- | ------------------------- |
| Volunteer dashboard mounts   | `GET /api/tasks/assigned/me` |
| Click on a task card         | `GET /api/tasks/:taskId`  |

**UI Notes:**
- Show NGO name and email from the populated `ngoId` field.
- Display task status (open / in_progress / completed) as a badge.
- Volunteers cannot create, assign, or complete tasks — hide those actions based on `user.role`.

---

### 4.5 Chat with Documents Module (RAG Chat)

**Routes used:**
- `POST /api/chat`
- `GET /api/chat`
- `GET /api/chat/:chatId/messages`
- `POST /api/chat/:chatId/message`
- `DELETE /api/chat/:chatId`
- *(Planned)* `PATCH /api/chat/:chatId` — rename chat

**Pages / Components:**
- `ChatPage.jsx` — full layout
  - `ChatSidebar.jsx` — lists all chats (`GET /api/chat`)
  - `ChatWindow.jsx` — shows messages for selected chat
  - `MessageBubble.jsx` — user or assistant message
  - `SourceDrawer.jsx` — shows source chunks from the answer
  - `NewChatModal.jsx` — create chat with optional file scope

**When to Call:**

| Event                             | Route                               |
| --------------------------------- | ----------------------------------- |
| Chat page mounts                  | `GET /api/chat`                     |
| User selects a chat in sidebar    | `GET /api/chat/:chatId/messages`    |
| User creates a new chat session   | `POST /api/chat`                    |
| User sends a message              | `POST /api/chat/:chatId/message`    |
| User deletes a chat               | `DELETE /api/chat/:chatId`          |

**Sending a Message Flow:**

```js
const sendMessage = async (question) => {
  setMessages(prev => [...prev, { role: 'user', content: question }]);
  setLoading(true);
  try {
    const res = await api.post(`/api/chat/${chatId}/message`, { question });
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: res.data.answer,
      sources: res.data.sources,
    }]);
    // Update chat title in sidebar if it was auto-set
    if (res.data.chatTitle) updateChatTitle(chatId, res.data.chatTitle);
  } catch (err) {
    // Show inline error, don't remove user message
    setError('Failed to get an answer. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Assistant Message with Sources:**

- Always display the `sources` array below an assistant message.
- Show `fileName` and `preview` for each source.
- Use `score` to indicate confidence (optional, display as percentage).

**Loading States:**
- While waiting for assistant response: show a typing indicator (`...`) in the chat.
- Disable the input box while a message is in-flight.

**File-Scoped Chats:**
- When creating a new chat, let users optionally select from their uploaded (`status: "ready"`) files using a multi-select dropdown populated from `GET /api/files/my-uploads`.
- Pass selected `fileIds` in the `POST /api/chat` body.

---

### 4.6 Direct RAG Query Module

**Routes used:**
- `POST /api/rag/ask`
- `POST /api/rag/ask-file/:fileId`

**Pages / Components:**
- `QuickAskPage.jsx` — one-shot Q&A (no chat history)
- `FileQuestionPanel.jsx` — ask about a specific file inline on `FileDetailPage`

**When to Call:**

| Event                              | Route                            |
| ---------------------------------- | -------------------------------- |
| User submits quick question form   | `POST /api/rag/ask`              |
| User asks about a specific file    | `POST /api/rag/ask-file/:fileId` |

**Compared to Chat:**

| Feature             | `/api/rag/ask`    | `/api/chat/:id/message` |
| ------------------- | ----------------- | ----------------------- |
| Conversation history | ❌ None           | ✅ Last 5 messages       |
| Source citations    | ✅ Yes            | ✅ Yes                   |
| Stateful session    | ❌ No             | ✅ Yes                   |
| Use case            | Quick one-off Q&A | Ongoing document chat   |

---

## 5. Suggested Frontend Folder & Service Organization

```
src/
├── api/
│   └── axios.js               # Axios instance (withCredentials, base URL, interceptors)
│
├── services/
│   ├── authService.js         # register, login, logout, fetchMe
│   ├── fileService.js         # uploadFile, uploadMultipleFiles, getMyUploads, getFilesByLocation, getFileById
│   ├── taskService.js         # createTask, getMyTasks, getAssignedToMe, getTaskById,
│   │                          #   getMatches, assignVolunteer, removeVolunteer, completeTask
│   ├── chatService.js         # createChat, getMyChats, getChatMessages, sendMessage, deleteChat
│   └── ragService.js          # askQuestion, askQuestionByFile
│
├── hooks/
│   ├── useAuth.js             # reads from AuthContext
│   ├── useFileStatus.js       # polls GET /api/files/:id for ingestion status
│   ├── useChats.js            # GET /api/chat — list of user chats
│   ├── useChatMessages.js     # GET /api/chat/:chatId/messages
│   └── useTasks.js            # GET /api/tasks/my or /assigned/me
│
├── context/
│   └── AuthContext.jsx        # user, login(), logout(), loading
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── files/
│   │   ├── FileUploadForm.jsx
│   │   ├── FileCard.jsx
│   │   └── IngestionStatusBadge.jsx
│   ├── tasks/
│   │   ├── TaskCard.jsx
│   │   ├── CreateTaskModal.jsx
│   │   ├── AssignedVolunteersList.jsx
│   │   └── VolunteerMatchCard.jsx
│   ├── chat/
│   │   ├── ChatSidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   └── SourceDrawer.jsx
│   └── shared/
│       ├── ProtectedRoute.jsx
│       ├── Spinner.jsx
│       └── ErrorMessage.jsx
│
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── NGODashboard.jsx        # role === "ngo"
    ├── VolunteerDashboard.jsx  # role === "volunteer"
    ├── TaskDetailPage.jsx
    ├── FileUploadPage.jsx
    ├── ChatPage.jsx
    └── QuickAskPage.jsx
```

---

## 6. Edge Cases & Integration Notes

### Auth & Session

- **Session expiry:** The session lasts 24 hours. After expiry, requests return `401`. The response interceptor should catch this and redirect to `/login`.
- **Role mismatch:** The backend returns `403` when a user calls a role-protected route they're not allowed on. Show a "You don't have permission" page.
- **Do not store the JWT in localStorage** — the backend uses session cookies. The JWT in the login response body is mostly for client-side role checks without an extra network call; use it if needed but don't rely on it for auth state.

### File Uploads

- **Multer validation:** The backend uses Multer for file upload. If Multer rejects the file (e.g., unsupported type, file too large), the error message is returned in `err.message`.
- **Ingestion is async:** Upload response is immediate even though AI ingestion is still running. Don't call `/api/rag/ask` on the file until its `status === "ready"`. Poll using `useFileStatus`.
- **Only `volunteer` role can upload** (`isVolunteer` middleware). NGOs currently cannot upload files via these routes.

### Tasks

- **`renameChat` is missing in router:** `PATCH /api/chat/:chatId` controller exists but is **not registered**. Add `router.patch('/:chatId', renameChat)` to `chatRoutes.js` before wiring up the rename UI.
- **Volunteer availability is automatic:** When a volunteer is assigned, `availability` becomes `false`. This feeds back into the matching algorithm — unavailable volunteers won't appear in matches.
- **`sourceFileId` in tasks:** This field is optional and intended for AI-generated tasks (where an NGO uses RAG output to create a task). The frontend can pre-fill this when navigating from a RAG answer to a create task form.
- **`assignedVolunteers` is populated** in `GET /api/tasks/my` but not in `GET /api/tasks/assigned/me` (only `ngoId` is populated there).

### Chat

- **Auto-titling:** On the first message, the chat title is automatically set to the first 60 characters of the question. The response includes `chatTitle` — update it in the sidebar state when received.
- **History window:** The backend fetches the last 6 messages for context (excluding the one just saved). No action needed on the frontend.
- **Empty `fileIds`:** If `fileIds` is empty when creating a chat, RAG will search across **all** files uploaded by the user. This can be slow if the user has many files — guide users to scope their chats.
- **Deleting a chat** also cascades and deletes all messages in that chat (handled server-side).

### RAG

- **No history in `/api/rag/ask`:** Each call is independent. For iterative Q&A, redirect to the `/chat` module.
- **Empty answer:** If no relevant chunks are found, the model falls back to a general answer. The `sources` array may be empty.
- **File must be `status: "ready"`** before RAG can return meaningful answers. Design the UI to warn if a user tries to ask about a file still being ingested.

### CORS

- The backend allows `http://localhost:5173` only. For production, update the `origin` in `index.js` and ensure `credentials: true` is kept.

---