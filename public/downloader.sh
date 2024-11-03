#!/bin/bash
# CS2D Server Downloader (MIT License)
# Copyright (c) 2024 Ernest Paśnik

err() {
    echo "Error: $1"
    exit 1
}

cwd=$(pwd)

read -p "CS2D Server files will be downloaded to this dir ${cwd} [Y/n]: " confirm
confirm=${confirm:-Y}
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Download canceled"
    exit 0
fi

if ! command -v unzip >/dev/null 2>&1; then
    err "unzip is not installed"
fi

echo "Downloading CS2D server files..."
ver=$(curl -Ss "https://unrealsoftware.de/game_cs2d.php" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sed -e 's/\.//g')
if [ -z "$ver" ]; then
    err "Failed to retrieve version number"
fi

cid=$(curl -Ss "https://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip" | grep -m 1 -o '"get.php[^"]\+"' | cut -d'"' -f2 | sed 's/.\+cid=//g')
if [ -z "$cid" ]; then
    err "Failed to retrieve content ID"
fi

curl -s "https://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip&p=1&cid=${cid}" -o "cs2d_${ver}_linux.zip"
if [ $? -ne 0 ]; then
    err "Failed to download cs2d_${ver}_linux.zip"
fi

curl -s "https://unrealsoftware.de/files_pub/cs2d_dedicated_linux.zip" -o "cs2d_dedicated_linux.zip"
if [ $? -ne 0 ]; then
    err "Failed to download cs2d_dedicated_linux.zip"
fi

echo "Unzipping files..."
unzip -qq -o "cs2d_${ver}_linux.zip" || err "Failed to unzip cs2d_${ver}_linux.zip"
unzip -qq -o "cs2d_dedicated_linux.zip" || err "Failed to unzip cs2d_dedicated_linux.zip"

echo "Cleaning up..."
rm -f "cs2d_${ver}_linux.zip" "cs2d_dedicated_linux.zip" CS2D libsteam_api.so maps/temp.map
rm -f sys/autobuy.cfg sys/autoexec.cfg sys/config.cfg sys/controls.cfg sys/editor.cfg sys/filters.cfg sys/mods.cfg
rm -f sys/controls.lst sys/favorites.lst sys/maptypes.lst
rm -f sys/core/dls.cache sys/core/svl.cache sys/core/version.cfg
rm -rf help logos screens gfx/fonts sys/cache sys/language

chmod +x cs2d_dedicated
echo "CS2D server files downloaded and extracted successfully"
