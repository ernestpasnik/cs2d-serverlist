# **CS2D Server List**

**[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)**

A **Node.js** application for **real-time monitoring** of **CS2D** game servers, featuring a **free and simple public API** for accessing server details.

🌐 **[Live Website](https://cs2d.pp.ua)**

![CS2D Server List Screenshot](https://i.imgur.com/YQzKxmI.png)

---

## **Features**

- **📡 Servers**: Real-time status, player count, and map information.
- **🏆 Stats**: Leaderboards and player statistics.
- **🗺️ Maps**: Map parser and live view of available maps.
- **🛠️ Tools**: Lua script for automatic leaderboard uploads and **server status on Discord**.
- **🔌 API**: Free, simple, and CORS-enabled for easy integration.

---

## **Requirements**

- **Node.js** (v18+)
- **Redis** (for caching and real-time data)
- **IPInfo API Key** (for geolocation features)

---

## **Installation**

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

## **See Also**

- **[CS2D LuaJIT](https://github.com/MikuAuahDark/cs2djit)** – Created by **MikuAuahDark**, this project replaces the CS2D Lua engine with **LuaJIT** for faster server performance, support for external Lua C modules, and **FFI (Foreign Function Interface)**.

---

## **License**

This project is licensed under the **[MIT License](LICENSE)**.
