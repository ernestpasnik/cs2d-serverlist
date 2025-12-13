# CS2D Server List

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://cs2d.pp.ua)

**CS2D Server List** is an amateur project for monitoring **CS2D** game servers, built with **Node.js** and **Redis**. It provides a **public API** for accessing server status, player statistics, and map information with **CORS support**.

![CS2D Server List Preview](https://i.imgur.com/YQzKxmI.png)

---

## Features

* **📡 Server Monitoring** – Track server status, active players, and current maps.
* **🏆 Player Statistics** – Leaderboards and detailed player info.
* **🗺️ Map Parser** – View available maps and their details.
* **🛠️ Automation Tools** – Lua scripts for uploading leaderboards.
* **🔌 Free Public API** – CORS-enabled API for easy integration.

---

## Requirements

* **Node.js** v20+
* **Redis**
* **IPInfo API Key**

---

## Quick Start

```bash
git clone https://github.com/ernestpasnik/cs2d-serverlist.git
cd cs2d-serverlist
npm install
```

Create `.env`:

```env
HOST=0.0.0.0
PORT=3000
REDIS_URL=redis://127.0.0.1:6379
IPINFO_APIKEY=your_api_key_here
```

```bash
npm start
```

---

## Related

* **[CS2D LuaJIT](https://github.com/MikuAuahDark/cs2djit)** – Replaces the default CS2D Lua engine with **LuaJIT**, enabling faster performance and support for external Lua C modules.

---

## License

This project is licensed under the **[MIT License](LICENSE)**.