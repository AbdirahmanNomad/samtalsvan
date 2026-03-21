# Samtalsvän 📞

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-orange.svg)](https://webrtc.org/)

*A simple, accessible WebRTC video call application designed for elderly users.*

*En enkel, tillgänglig WebRTC-videosamtalsapplikation designad för äldre användare.*

---

## 🙏 Why This Project Exists

I'm a Swedish citizen, originally from Somalia. I wanted to give something back to the country that welcomed me. Sweden has a growing elderly population, and many seniors feel isolated – especially when technology becomes a barrier. Existing video tools often require accounts, downloads, or confusing steps.

**Samtalsvän** (Swedish for "Conversation Friend") is my small contribution: a tool that turns a video call into a one-click experience. A family member or volunteer creates a call, prints a QR code, and the elderly person simply scans it – that's it. No login, no password, no frustration.

If this tool helps even one person connect with a loved one, it was worth building.

---

## ✨ Features

### 🇬🇧 English
- 🔓 **No login required** – Just start a call and share the link
- 📱 **QR code sharing** – Easy sharing for mobile users
- 👁️ **High contrast, large buttons** – Accessible design for all users
- 🎥 **Camera/microphone selection** – Advanced settings hidden by default
- 🔒 **End-to-end encrypted** – WebRTC provides secure peer-to-peer connections
- 🗑️ **No data storage** – Room IDs are ephemeral, nothing is saved
- 🚫 **No tracking** – No analytics, cookies, or third-party services
- 👤 **No accounts** – No user registration or personal data collected

### 🇸🇪 Svenska
- 🔓 **Ingen inloggning krävs** – Starta bara ett samtal och dela länken
- 📱 **QR-kod delning** – Enkel delning för mobilanvändare
- 👁️ **Hög kontrast, stora knappar** – Tillgänglig design för alla användare
- 🎥 **Val av kamera/mikrofon** – Avancerade inställningar dolda som standard
- 🔒 **End-to-end kryptering** – WebRTC ger säkra peer-to-peer-anslutningar
- 🗑️ **Ingen datalagring** – Rum-ID:n är tillfälliga, ingenting sparas
- 🚫 **Ingen spårning** – Inga analyser, cookies eller tredjepartstjänster
- 👤 **Inga konton** – Ingen användarregistrering eller personlig data samlas in

---

## 🚀 Quick Start

### 📦 Using Node.js

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

### 🐳 Using Docker

```bash
# Build the image
docker build -t samtalsvan .

# Run the container
docker run -p 3000:3000 samtalsvan
```

Open http://localhost:3000 in your browser.

---

## ☁️ Deployment

### ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `BASE_URL` | Public URL for generating links | `http://localhost:3000` |

### 🎯 Deploy to Render (Recommended)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variable: `BASE_URL` = your render.com URL

### 🟣 Deploy to Heroku

```bash
heroku create samtalsvan
heroku config:set BASE_URL=https://samtalsvan.herokuapp.com
git push heroku main
```

### 🐳 Deploy with Docker Compose

```yaml
version: '3'
services:
  samtalsvan:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BASE_URL=https://your-domain.com
```

---

## 🔧 How It Works

1. 🎬 **Start a call** – Click "Start video call" to create a new room
2. 🔗 **Share the link** – Copy the link or share the QR code with your conversation partner
3. 📞 **Connect** – When they open the link, the video call starts automatically
4. 🏁 **End call** – Click "End call" when finished

---

## 🛠️ Technical Details

| Component | Technology |
|-----------|------------|
| 🖥️ Backend | Node.js + Express + Socket.io |
| 🎨 Frontend | Vanilla JavaScript + CSS |
| ✏️ Typography | Sweden Sans (official Swedish national font) |
| 📹 WebRTC | Peer-to-peer video using STUN servers |
| 📡 Signaling | Socket.io for offer/answer/ICE exchange |

---

## 📁 Project Structure

```
samtalsvan/
├── 📄 server.js           # Express + Socket.io server
├── 📦 package.json        # Dependencies
├── 🐳 Dockerfile          # Docker configuration
├── 📖 README.md           # This file
├── 🤝 CONTRIBUTING.md     # Contribution guidelines
├── 🔒 PRIVACY.md          # Privacy policy
├── ⚖️ LICENSE             # MIT License
└── 📁 public/
    ├── 📄 index.html      # Main HTML
    ├── ⚡ call.js         # WebRTC logic
    ├── 🎨 style.css       # Styles
    └── 📁 fonts/          # Sweden Sans fonts
        ├── SwedenSansBook.woff2
        ├── SwedenSansRegular.woff2
        ├── SwedenSansSemiBold.woff2
        └── SwedenSansBold.woff2
```

---

## 💻 Requirements

- ✅ Node.js 18+
- ✅ Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

---

## 🤝 Contributing

We welcome contributions of all kinds – code, design, translations, or just spreading the word. If you have ideas to make Samtalsvän even more accessible, please open an issue or pull request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

MIT – free to use, modify, and share. See [LICENSE](LICENSE).

---

## 🔒 Privacy

We don't collect any personal data. See [PRIVACY.md](PRIVACY.md) for details.

---

## 👤 Author

**Abdirahman Ahmed**  
📧 hello@abdirahman.net

---

Built with ❤️ for Sweden, and for every generation that deserves to stay connected.

*Byggt med ❤️ för Sverige, och för varje generation som förtjänar att hålla kontakten.*
