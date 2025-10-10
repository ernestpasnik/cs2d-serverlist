# CS2D Server List

A **Node.js** application for real-time monitoring of **CS2D** servers, featuring a public API for accessing server details.

🔗 **Live Demo:** [cs2d.pp.ua](https://cs2d.pp.ua)

---

## Features

- **Servers**: Real-time status, player count, and map information.
- **Stats**: Leaderboards and player statistics.
- **Maps**: Available maps and usage statistics.
- **Tools**: Lua script for automatic leaderboard uploads.
- **API**: Free, unlimited, and CORS-enabled.

---

## Requirements

- **Node.js**
- **Redis**
- **IPInfo API Key**

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ernestpasnik/cs2d-serverlist.git
   cd cs2d-serverlist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `.env`:
   ```env
   HOST=0.0.0.0
   PORT=3000
   REDIS_URL=redis://127.0.0.1:6379
   IPINFO_APIKEY=your_api_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

---

## License

This project is licensed under the **MIT License** – see [LICENSE](LICENSE) for details.