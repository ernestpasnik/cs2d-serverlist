## Introduction
A web application for browsing the server list from CS2D, featuring a [live demo](https://cs2d-serverlist.erpa.cc). The app also provides an [API](https://cs2d-serverlist.erpa.cc/api) for retrieving server data in JSON format, which you can freely use.

## Installation
1. Install geoipupdate package on your system `apt install -y geoipupdate`
2. Generate a license key by following the [instructions](https://support.maxmind.com/hc/en-us/articles/4407111582235-Generate-a-License-Key) and configure the GeoIP updater `nano /etc/GeoIP.conf`
```
AccountID your_account_id_here
LicenseKey your_license_key_here
DatabaseDirectory /usr/share/GeoIP
EditionIDs GeoLite2-Country
```
3. Run the following command to update the GeoIP database `geoipupdate`
4. Add a crontab entry to update the GeoIP database twice a week `crontab -e`
```
57 22 * * 0,4 geoipupdate >/dev/null 2>&1
``` 
5. Clone repository `git clone https://github.com/ernestpasnik/cs2d-serverlist.git`
6. Configure environment variables `nano cs2d-serverlist/.env`
```env
HOST=0.0.0.0
PORT=3000
COUNTRYDB=/usr/share/GeoIP/GeoLite2-Country.mmdb
USGNIP=81.169.236.243
USGNPORT=36963
```
7. Install dependencies `cd cs2d-serverlist && npm install`
8. Run the application `node app.js`

## Download the dedicated server
This script will download the CS2D dedicated server to the current user's directory.
```bash
curl -sL https://cs2d-serverlist.erpa.cc/cs2d_server_downloader.sh | bash
```

## License
This project is licensed under the [MIT License](LICENSE).
