## Introduction
A Node.js application that serves an HTTP page with an integrated API for querying and displaying a CS2D server list. The app provides real-time server information, including server status, players, and map details, through a dedicated API endpoint.

## Installation
1. Clone the Repository `git clone https://github.com/ernestpasnik/cs2d-serverlist.git`
2. Change into the repository directory `cd cs2d-serverlist`
3. Configure environment variables `nano .env`
```env
PORT=3000
NODE_ENV=production
IPDATA_APIKEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Note: You can get the IPDATA_APIKEY value by creating a free account at [ipdata.co](https://ipdata.co)

4. Install dependencies `npm install`
5. Run the application `npm start`

## License
This project is licensed under the [MIT License](LICENSE).
