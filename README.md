# CS2D Server List

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://cs2d.pp.ua)

A **real-time monitoring** tool for **CS2D** game servers, built with **Node.js** and **Redis**. It provides a **public API** for accessing server details, player statistics, and map information—all with **CORS support** for easy integration.

![CS2D Server List Preview](https://i.imgur.com/YQzKxmI.png)

---

## ✨ Key Features

- **📡 Real-Time Server Monitoring**: Track server status, player count, and current map.
- **🏆 Player Statistics**: Leaderboards and detailed player stats.
- **🗺️ Map Parser**: View available maps and their details.
- **🛠️ Automation Tools**: Lua script for auto-uploading leaderboards.
- **🔌 Free Public API**: Simple, CORS-enabled, and ready for integration.

---

## 📋 Requirements

- **Node.js** (v18 or higher)
- **Redis** (for caching)
- **IPInfo API Key** (for geolocation)

---

## 🚀 Quick Start

1. Clone the Repository
```bash
git clone https://github.com/ernestpasnik/cs2d-serverlist.git
cd cs2d-serverlist
```

2. Install Dependencies
```bash
npm install
```

3. Configure `.env`
```env
HOST=0.0.0.0
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
IPINFO_APIKEY=your_api_key_here
```

4. Run the Server
```bash
npm start
```

---

## 🔗 Related Projects

- **[CS2D LuaJIT](https://github.com/MikuAuahDark/cs2djit)** – A project by **MikuAuahDark** that replaces the default CS2D Lua engine with **LuaJIT**, enabling **faster performance**, support for **external Lua C modules**, and **FFI (Foreign Function Interface)**.

---

## 📜 License

This project is open-source and available under the **[MIT License](LICENSE)**.