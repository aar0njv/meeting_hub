<div align="center">
  <h1>Meeting Intelligence Hub</h1>
  <p><em>Automate transcript analysis and seamlessly query your meetings with an integrated AI chatbot.</em></p>

  [![Docker Compose](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](#)
  [![React.js](https://img.shields.io/badge/Frontend-React_Vite-yellow?style=for-the-badge&logo=react)](#)
  [![Express.js](https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](#)
  [![Supabase Database](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge&logo=supabase)](#)
</div>


## The Problem

Teams often waste valuable hours after meetings manually summarizing discussions, assigning action items, and scrolling endlessly through raw transcripts to find past decisions. Traditional meeting notes lack context, and searching for specific insights is slow and inefficient. Teams need a centralized, automated way to extract actionable intelligence from meeting text instantly.

## The Solution

**Meeting Intelligence Hub** is a multi-tier platform that turns raw meeting transcripts into structured insights and interactive knowledge.
-  **Automated Insights**: Automatically extracts decisions, action items, and focus scores from uploaded transcripts.
-  **RAG AI Chatbot**: An embedded chatbot allows users to contextually query past meetings and retrieve exact information instantly.
-  **Secure Storage**: Leverages Supabase PostgreSQL with Row Level Security for robust, persistent data management.

The application features a sleek React dashboard, a Node.js API layer for database interactions and file routing, and a dedicated Python FastAPI vector microservice for AI processing.

- [Design Document](https://docs.google.com/document/d/1yfJnLFGpExFHht5ivm_GveY_hdl97yt9jrKXkpeo4Us/edit?usp=drive_link)


## Tech Stack

- Programming languages: Python, JavaScript
- Frontend frameworks and UI: React (via Vite), CSS
- Backend frameworks and Database: Express.js, Supabase (PostgreSQL), Multer
- AI and vector microservices: FastAPI, ChromaDB, Sentence Transformers (RAG), Google Gemini API (gemini-2.5-flash)
- APIs and third-party tools: Uvicorn, python-dotenv, Docker Compose

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone <https://github.com/aar0njv/meeting_hub>
cd meeting hub
```

### 2. Configure Environment Variables

**Backend Setup (Node.js)**
```bash
cd backend
npm install
```

Create `backend/.env` and set keys:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```


**AI Service Setup (Python)**
```bash
cd ai_service
python -m venv venv
```

```powershell
.\.venv\Scripts\Activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `ai_service/.env` and set keys:

```env
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Native Local Setup 
Run the services natively if you choose not to use Docker.

**AI Microservice (Terminal 1)**
Navigate to the `ai_service` folder and set up Python:
```bash
cd ai_service
python -m venv .venv

# Activate:
# PowerShell: .\.venv\Scripts\Activate.ps1
# Mac/Linux: source .venv/bin/activate

python main.py
```

**Backend Server (Terminal 2)**
Navigate to the `backend` folder and start Express:
```bash
cd backend
npm install
npm run dev
```

**Frontend React App (Terminal 3)**
Navigate to the `frontend` folder and run Vite:
```bash
cd frontend
npm install
npm run dev
```

### 4. Docker Deployment 🐳

You can spin up the entire application stack—Frontend, Backend, and AI Service using Docker Compose.

```bash
docker-compose up --build
```
- **Frontend Dashboard:** [http://localhost:80](http://localhost:80)
- **Node API:** [http://localhost:5000](http://localhost:5000)
- **Python AI Microservice API:** [http://localhost:8000](http://localhost:8000)

## 📝 Sample Input
To test the system, you can upload the provided sample transcripts located in the root repository.
