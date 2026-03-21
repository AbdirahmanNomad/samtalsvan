# Samtalsvän 📞

A simple, accessible WebRTC video call application designed for elderly users.

En enkel, tillgänglig WebRTC-videosamtalsapplikation designad för äldre användare.

---

## English

### Features

- **No login required** - Just start a call and share the link
- **QR code sharing** - Easy sharing for mobile users
- **High contrast, large buttons** - Accessible design for all users
- **Camera/microphone selection** - Advanced settings hidden by default
- **End-to-end encrypted** - WebRTC provides secure peer-to-peer connections
- **No data storage** - Room IDs are ephemeral, nothing is saved
- **No tracking** - No analytics, cookies, or third-party services
- **No accounts** - No user registration or personal data collected

### Quick Start

#### Using Node.js

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

#### Using Docker

```bash
# Build the image
docker build -t samtalsvan .

# Run the container
docker run -p 3000:3000 samtalsvan
```

Open http://localhost:3000 in your browser.

### Deployment

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `BASE_URL` | Public URL for generating links | `http://localhost:3000` |

#### Deploy to Heroku

```bash
heroku create samtalsvan
heroku config:set BASE_URL=https://samtalsvan.herokuapp.com
git push heroku main
```

#### Deploy with Docker Compose

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

### How It Works

1. **Start a call** - Click "Start video call" to create a new room
2. **Share the link** - Copy the link or share the QR code with your conversation partner
3. **Connect** - When they open the link, the video call starts automatically
4. **End call** - Click "End call" when finished

### Technical Details

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JavaScript + CSS
- **Typography**: Sweden Sans (official Swedish national font)
- **WebRTC**: Peer-to-peer video using STUN servers
- **Signaling**: Socket.io for offer/answer/ICE exchange

---

## Svenska

### Funktioner

- **Ingen inloggning krävs** - Starta bara ett samtal och dela länken
- **QR-kod delning** - Enkel delning för mobilanvändare
- **Hög kontrast, stora knappar** - Tillgänglig design för alla användare
- **Val av kamera/mikrofon** - Avancerade inställningar dolda som standard
- **End-to-end kryptering** - WebRTC ger säkra peer-to-peer-anslutningar
- **Ingen datalagring** - Rum-ID:n är tillfälliga, ingenting sparas

### Snabbstart

#### Med Node.js

```bash
# Installera beroenden
npm install

# Starta servern
npm start
```

Öppna http://localhost:3000 i din webbläsare.

#### Med Docker

```bash
# Bygg avbilden
docker build -t samtalsvan .

# Kör containern
docker run -p 3000:3000 samtalsvan
```

Öppna http://localhost:3000 i din webbläsare.

### Driftsättning

#### Miljövariabler

| Variabel | Beskrivning | Standard |
|----------|-------------|----------|
| `PORT` | Serverport | `3000` |
| `BASE_URL` | Publik URL för att generera länkar | `http://localhost:3000` |

#### Driftsätt på Heroku

```bash
heroku create samtalsvan
heroku config:set BASE_URL=https://samtalsvan.herokuapp.com
git push heroku main
```

#### Driftsätt med Docker Compose

```yaml
version: '3'
services:
  samtalsvan:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BASE_URL=https://din-domän.se
```

### Hur Det Fungerar

1. **Starta ett samtal** - Klicka på "Starta videosamtal" för att skapa ett nytt rum
2. **Dela länken** - Kopiera länken eller dela QR-koden med din samtalpartner
3. **Anslut** - När de öppnar länken startar videosamtalet automatiskt
4. **Avsluta samtal** - Klicka på "Avsluta" när du är klar

### Tekniska Detaljer

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JavaScript + CSS
- **WebRTC**: Peer-to-peer-video med STUN-servrar
- **Signalering**: Socket.io för offer/answer/ICE-utbyte

---

## Development / Utveckling

### Project Structure / Projektstruktur

```
samtalsvan/
├── server.js           # Express + Socket.io server
├── package.json        # Dependencies
├── Dockerfile          # Docker configuration
├── README.md           # This file
└── public/
    ├── index.html      # Main HTML
    ├── call.js         # WebRTC logic
    ├── style.css       # Styles
    └── fonts/          # Sweden Sans fonts
```

### Requirements / Krav

- Node.js 18+
- Modern web browser with WebRTC support

### License / Licens

MIT
