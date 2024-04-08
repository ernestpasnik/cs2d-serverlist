## ⚡️ Introduction
A NodeJS application to display list of servers from CS2D. [Click here](https://cs2d-serverlist.erpa.cc/) to view live demo.

## ⚙️ Installation
Install `geoipupdate` package which is used to update the GeoIP database on your system:
```bash
apt install -y geoipupdate
```
Generate a license key by following the instructions [https://support.maxmind.com/hc/en-us/articles/4407111582235-Generate-a-License-Key](here). Once you have your AccountID and LicenseKey, configure the GeoIP updater:
```bash
nano /etc/GeoIP.conf
```
```
AccountID your_account_id_here
LicenseKey your_license_key_here
DatabaseDirectory /usr/share/GeoIP
EditionIDs GeoLite2-Country
```

Run the following command to update the GeoIP database:
```bash
geoipupdate
```

Add a crontab entry to update the GeoIP database twice a week:
```bash
(crontab -l 2>/dev/null; echo "57 22 * * 0,4 geoipupdate >/dev/null 2>&1") | crontab -
```
Clone repository and configure:
```bash
git clone https://github.com/ernestpasnik/cs2d-serverlist.git
cd cs2d-serverlist
npm install
nano .env
```
```env
PORT=3000
COUNTRYDB=/usr/share/GeoIP/GeoLite2-Country.mmdb
USGNIP=81.169.236.243
USGNPORT=36963
```

Finally, run the application:
```bash
node app.js
```

## 📜 Extra
This command will retrieve and extract CS2D server files into the current working directory:
```bash
curl -sSL https://cs2d-serverlist.erpa.cc/cs2d_server_downloader.sh | bash
```

## License
This project is licensed under the [MIT License](LICENSE).
