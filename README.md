# 🧠 Navigating mental health services with LLMs

## 📌 Project Overview

A prototype tool that helps people "talk their way" to relevant mental health services. This project aims to streamline the discovery of services for both consumers (people seeking help) and professionals (e.g., social workers, psychologists) by consolidating fragmented, outdated information into a conversational, location-aware interface.

## 🎯 Objectives

* Enable users to chat with an AI to discover relevant services.
* Query structured/semi-structured service data from a shared database.
* Use user location to filter and rank results.
* Return grounded responses with citations (source, last-checked date, and reasoning).
* (Optional) Enable trusted users to suggest new services via chat, with a moderation process.

## 📁 Directory Structure

```
mental-health-chatbot/
├── backend/               # FastAPI app for LLM orchestration + data search
│   ├── README.md
│   └── ...
├── frontend/              # React-based chat UI
│   ├── README.md
│   └── ...
├── .env.example           # Sample environment config
├── requirements.txt       # Python dependencies
├── package.json           # Frontend dependencies
├── .gitignore
└── README.md              # This file
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yilingsu1/COMP30022-Group-30-Mental-Health-Services-with-LLM.git
cd COMP30022-Group-30-Mental-Health-Services-with-LLM
```

### 2. Set Up Environment Variables

* Copy `.env.example` to `.env` and fill in any required values.
* Your tutor will provide API keys for OpenAI/Anthropic/Gemini access.

### 3. Set Up Backend (FastAPI)

See `backend/README.md`

### 4. Set Up Frontend (React)

See `frontend/README.md`

## 🤝 Contributing

* Fork the repo and create a branch (`feature/your-feature-name`).
* Submit a pull request with clear commit history and description.
* Use issues/discussions to coordinate or suggest new features.

## 👥 Team Contacts

| Role          | Name | GitHub    | Email                                         |
| ------------- | ---- | --------- | --------------------------------------------- |
| Product Owner  | Manya Garg | @username | [manyagarg312@gmail.com](mailto:manyagarg312@gmail.com) |
| Scrum Master | Gurshan Singh  | @gurshan2604 | [gurshan2604@gmail.com](mailto:gurshan2604@gmail.com) |
| Developer   | Suhas Agarwal  | @username | [Suhas.agrawal86@gmail.com](mailto:Suhas.agrawal86@gmail.com) |
| Developer | Yiling Su  | @yilingsu1 | [yilingsu1@gmail.com](mailto:yilingsu1@gmail.com) |
| Developer  | Vishay Chotai  | @ChotaiVishay | [chotai.vishay@gmail.com](mailto:chotai.vishay@gmail.com) |

## 📌 Notes

* Focus on building the **Core MVP** first: chat → LLM → search → results.
* Avoid feature creep early on.
* Follow up with stretch goals only if time permits.

---

Separate READMEs in `/frontend` and `/backend` should include setup instructions, dependencies, and development tips specific to each component.
