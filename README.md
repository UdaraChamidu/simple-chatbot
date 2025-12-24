# ✨ Lumina AI

**Lumina AI** is a premium, next-generation chatbot interface designed to provide a seamless and visually stunning conversational experience. Built with a modern tech stack, it features strict usage limits, secure authentication, and a "Glassmorphism" design aesthetic.

![Lumina UI Preview](./lumina_chatbot_ui_1766549932791.png)
*(Note: Add your screenshot here)*

## 🚀 Features

### 🎨 **Premium UI/UX**
*   **Theme**: Deep Space Dark Mode with Neon Violet accents.
*   **Glassmorphism**: Translucent cards, modals, and sidebars using backdrop filters.
*   **Animations**: Smooth fade-ins and slide-ups for messages.
*   **Responsive**: Mobile-friendly layout with a collapsible sidebar structure.

### 🧠 **Intelligent Chat**
*   Powered by Google **Gemini AI**.
*   Markdown support for code blocks and formatted text.
*   Context-aware conversations (Session history).

### 🛡️ **Smart Limits & Security**
*   **Guest Mode**:
    *   Limited to **5 Prompts** per device (Fingerprint & IP tracking).
    *   No login required.
*   **Member Mode**:
    *   **Login via Google** (Supabase Auth).
    *   Increases limit to **8 Prompts**.
    *   Persistent User Profile.
*   **Anti-Abuse**:
    *   IP Abuse Monitoring (blocks concurrent guest sessions from same IP).
    *   Device Fingerprinting (prevents clearing cookies to bypass limits).

---

## 🛠️ Technology Stack

### **Frontend**
*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) (Utility-first + Custom CSS Variables)
*   **Icons**: Heroicons / SVG
*   **State**: React Hooks (`UseChat` custom hook)
*   **Auth**: Supabase Client

### **Backend**
*   **API**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **AI Engine**: Google Gemini API
*   **Utilities**: `fingerprintjs` for device ID, IP extraction logic.

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   Supabase Account

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd lumina-ai
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

**Environment Variables (`.env`):**
Create a `.env` file in `backend/`:
```env
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_anon_key"
GEMINI_API_KEY="your_gemini_api_key"
```

**Run Server:**
```bash
uvicorn app.main:app --reload
```
*Server runs at: `http://localhost:8000`*

### 3. Frontend Setup
Navigate to the frontend folder and install dependencies:
```bash
cd frontend
npm install
```

**Run Client:**
```bash
npm run dev
```
*Client runs at: `http://localhost:5173`*

---

## 📂 Project Structure

```
lumina-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # API Entry point & Routes
│   │   ├── services/          # Business Logic (AI, Limits)
│   │   └── database.py        # Supabase Connection
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/        # Header, Sidebar, ChatArea
│   │   │   ├── UI/            # Reusable Glass Components
│   │   │   └── LoginModal.jsx
│   │   ├── hooks/             # UseChat (State Management)
│   │   └── index.css          # Tailwind & Theme Variables
│   ├── tailwind.config.cjs    # Tailwind Configuration
│   └── vite.config.js
│
└── README.md
```

## 🔒 Limit Logic Explained

1.  **Fingerprint Check**: Every user gets a unique device ID.
2.  **IP Check (Strict)**: If an IP makes >10 requests/hour across multiple fingerprints, new guest sessions are blocked.
3.  **Inheritance**: When a Guest logs in, their current usage (e.g., 5/5) is carried over to their User account (becomes 5/8), granting them 3 bonus prompts immediately.

---

Made with ✨ by **Lumina Team**
