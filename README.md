# Country Launch Tracker 🚀

Dashboard za sledenje napredka pri odpiranju novih držav.

## Funkcionalnosti

- **Tabovi po državah:** HR, CZ, PL, GR, IT, HU, SK + možnost dodajanja novih
- **Task lista:** Enaka za vse države, z možnostjo dodajanja custom taskov
- **Za vsak task:**
  - Checkbox (done/not done)
  - Dropdown za odgovorno osebo (Ajda, Dejan, Grega, Petra, Teja)
  - Notes gumb za vpis idej in izboljšav
- **Progress bar:** Prikaže % opravljenih taskov za vsako državo

## Tech Stack

- Node.js + Express
- Vanilla JavaScript frontend
- JSON file storage
- PM2 process manager
- Nginx reverse proxy

## Deployment

```bash
npm install
pm2 start server.js --name launches
```

Server runs on port 3006.

## URL

https://miki.noriks.com/launches
