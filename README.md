# NeuroScreen AI 🧠

**Explainable, multimodal AI for early neurological screening and longitudinal health monitoring.**

NeuroScreen AI is an explainable, multimodal AI-powered platform designed for early neurological screening and longitudinal health monitoring. It analyzes multiple non-invasive indicators — such as voice characteristics, facial and motor patterns, and questionnaire-based information — to identify potential neurological risk patterns.

The system combines Machine Learning and Explainable AI (XAI) to provide understandable insights into the factors contributing to a screening result. Instead of replacing clinical diagnosis, NeuroScreen AI serves as an **early-screening and monitoring support tool**, helping users track changes over time and encouraging timely consultation with healthcare professionals.

> ⚠️ **Disclaimer:** NeuroScreen AI is not a diagnostic medical device. It is intended solely for preliminary screening and monitoring support. Clinical diagnosis and treatment decisions must always be made by qualified healthcare professionals.

---

## ✨ Key Features

- 🧩 **Multimodal neurological screening** — voice, motor, and questionnaire-based inputs
- 🤖 **AI/ML-based risk-pattern analysis**
- 🔍 **Explainable AI (XAI) insights** — understand *why* a result was flagged
- 📈 **Longitudinal health monitoring** — track changes over time
- 🖥️ **User-friendly dashboard**
- 🩺 **Non-invasive assessment**
- 🔒 **Secure and accessible digital platform**

## 🎯 Goal

To make preliminary neurological screening more accessible, interpretable, and useful for continuous monitoring — while keeping clinical diagnosis and treatment decisions with qualified healthcare professionals.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS
- **AI/ML:** Google AI Studio (Gemini)
- **Backend / Infrastructure:** Firebase (Auth, Firestore, Hosting)

---

## 📂 Project Structure

```
neuroscreen-ai/
├── src/
│   ├── components/       # UI components (Motor Assessment, Voice Analysis, Dashboard, etc.)
│   ├── firebase/          # Firebase configuration & services
│   ├── types/             # TypeScript type definitions
│   ├── utils/              # Helper utilities
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── firebase-applet-config.json
├── .firebaserc
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended) and a package manager (bun/npm/yarn)
- A [Firebase](https://firebase.google.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/neuroscreen-ai.git
cd neuroscreen-ai

# Install dependencies
bun install   # or: npm install

# Configure environment variables
cp .env.example .env
# then fill in your Firebase and Google AI Studio credentials

# Run the development server
bun run dev   # or: npm run dev
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues) or open a pull request.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Built with [Google AI Studio](https://aistudio.google.com/)
- Powered by [Firebase](https://firebase.google.com/)
