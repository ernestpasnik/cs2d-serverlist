#!/bin/bash

# CS2D Linux Server Downloader
# Copyright (c) 2023, Ernest Paśnik
# Released under the MIT License

# Check if 'unzip' command is available
if ! command -v unzip >/dev/null 2>&1 ; then
	echo "Error: 'unzip' is not installed. Please install it and try again."
	exit 1
fi

# Download CS2D server files
echo "Downloading CS2D server files..."
ver=$(curl -H "User-Agent:" -Ss "http://unrealsoftware.de/game_cs2d.php" | grep -Po "([0-9]\.)+([0-9]\.)+([0-9]\.)+([0-9])" | sed -e 's/\.//g')
cid=$(curl -H "User-Agent:" -Ss "http://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip" | grep -m 1 -o '"get.php[^"]\+"' | cut -d'"' -f2 | sed 's/.\+cid=//g')
curl --progress-bar -H "User-Agent:" -S "http://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip&p=1&cid=${cid}" -o cs2d_${ver}_linux.zip
curl --progress-bar -H "User-Agent:" -S "http://unrealsoftware.de/files_pub/cs2d_dedicated_linux.zip" -o cs2d_dedicated_linux.zip

# Unzip the downloaded files
echo "Unzipping files..."
unzip -qq -o cs2d_${ver}_linux.zip
unzip -qq -o cs2d_dedicated_linux.zip

# Clean up unnecessary files
echo "Cleaning up..."
rm -f cs2d_${ver}_linux.zip cs2d_dedicated_linux.zip CS2D libsteam_api.so maps/temp.map
rm -f sys/autobuy.cfg sys/autoexec.cfg sys/config.cfg sys/controls.cfg sys/editor.cfg sys/filters.cfg sys/mods.cfg
rm -f sys/controls.lst sys/favorites.lst sys/maptypes.lst
rm -f sys/core/dls.cache sys/core/svl.cache sys/core/version.cfg
rm -rf help logos screens gfx/fonts sys/cache sys/language

echo "CS2D server files downloaded and extracted successfully."
