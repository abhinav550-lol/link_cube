
# 🚀 LinkCube

### *AI-Powered NGO Resource & Volunteer Coordination Platform*

> Transforming fragmented NGO data into actionable insights and connecting the right people to the right causes—instantly.

---

## 🌍 **Problem**

* NGOs, especially in rural areas, operate on **fragmented and unstructured data**
* Reports exist in multiple formats (PDFs, images, spreadsheets) with **no unified system**
* Critical issues remain **hidden or delayed**
* Volunteers are **not efficiently matched** to real needs
* No strong platform exists for **direct NGO ↔ volunteer collaboration**

---

## 💡 **Solution — LinkCube**

LinkCube is an **AI-powered platform** that:

* 📂 Centralizes scattered NGO data
* 🧠 Uses **RAG (Retrieval-Augmented Generation)** to extract insights
* ⚡ Converts issues into **actionable tasks**
* 🎯 Matches volunteers based on **skills, availability, and relevance**
* 🤝 Enables a **two-way connection** between NGOs and volunteers

---

## ✨ **Key Features**

### 🧠 AI-Based Data Processing

* Supports multiple formats (PDF, images, CSV, etc.)
* Converts unstructured data into **structured, usable insights**

---

### 🔍 RAG-Powered Insight Extraction

* Analyzes reports to:

  * identify community needs
  * detect urgent issues
  * generate meaningful summaries

---

### ⚡ Automated Task Generation

* AI converts identified problems into **real-world tasks**
* NGOs can review and publish tasks quickly

---

### 🎯 Smart Volunteer Matching

* Matches volunteers using:

  * skills
  * availability
  * context relevance

---

### 📊 Intelligent Candidate Ranking

* Recommends **top volunteers** for each task automatically

---

### 🔄 Two-Way Collaboration

* NGOs can invite volunteers
* Volunteers can browse and apply for tasks

---

### 💬 Chat with Documents (RAG Chat)

* Ask questions on uploaded NGO reports
* Get **source-backed answers with citations**

---

## 🛠 **Tech Stack**

### **Frontend**

* React (Vite)
* Tailwind CSS
* Axios

### **Backend**

* Node.js + Express
* MongoDB (Mongoose)
* Multer (file uploads)

### **AI Layer**

* Groq + Llama 3 (LLM)
* RAG (Retrieval-Augmented Generation)
* MongoDB Atlas Vector Search

---

## ⚙️ **System Flow**

```
📂 Upload NGO Data
        ↓
🧠 AI Processing (Parsing + Cleaning)
        ↓
📊 RAG Analysis (Insights Extraction)
        ↓
⚡ Task Generation
        ↓
🎯 Volunteer Matching
        ↓
🤝 Real-World Impact
```

---

## 📌 **Core Modules**

* 🔐 Authentication (NGO / Volunteer roles)
* 📂 File Upload & Processing
* 🧠 RAG Engine (Insight Extraction + Q&A)
* 📋 Task Management System
* 🎯 Volunteer Matching Engine
* 💬 Chat with Documents

---

## 🚀 **Getting Started**

### 1. Clone the repo

```bash
git clone https://github.com/abhinav550-lol/link-cube.git
cd link-cube
```

### 2. Install dependencies

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

---

### 3. Setup environment variables

Create `.env` in backend:

```env
PORT=3000
MONGO_URI=your_mongodb_uri
SESSION_SECRET=your_secret
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_embedding_key
```

---

### 4. Run the project

```bash
# backend
npm run dev

# frontend
npm run dev
```

---

## 🧠 **AI Capabilities**

* Document parsing & text extraction
* Semantic search using embeddings
* Context-aware Q&A (RAG)
* Insight extraction from NGO reports
* Skill-based recommendation system

---

## 🎯 **Impact**

* ⚡ Faster identification of critical issues
* 🎯 Efficient volunteer utilization
* 📉 Reduced duplication of efforts
* 📊 Data-driven NGO decision making
* 🌍 Improved rural and grassroots impact

---

## 🔮 **Future Scope**

* 📱 Mobile-first field reporting
* 🌐 Multilingual support
* 📈 Predictive need analysis
* 🧾 OCR for handwritten reports
* 🏛 Integration with government datasets

---

## 🤝 **Contributing**

Contributions, ideas, and improvements are welcome!
Feel free to fork the repo and submit a PR.

---

## ⭐ **Show Your Support**

If you like this project, give it a ⭐ on GitHub!
