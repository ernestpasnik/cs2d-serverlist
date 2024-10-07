#!/bin/bash

# CS2D Server Downloader (MIT License)
# Copyright (c) 2023 Ernest Paśnik

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Check if 'unzip' command is available
if ! command -v unzip >/dev/null 2>&1; then
    handle_error "'unzip' is not installed. Please install it and try again."
fi

# Download CS2D server files
echo "Downloading CS2D server files..."
ver=$(curl -Ss "https://unrealsoftware.de/game_cs2d.php" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sed -e 's/\.//g')
if [ -z "$ver" ]; then
    handle_error "Failed to retrieve version number."
fi

cid=$(curl -Ss "https://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip" | grep -m 1 -o '"get.php[^"]\+"' | cut -d'"' -f2 | sed 's/.\+cid=//g')
if [ -z "$cid" ]; then
    handle_error "Failed to retrieve content ID."
fi

curl --progress-bar -S "https://unrealsoftware.de/get.php?get=cs2d_${ver}_linux.zip&p=1&cid=${cid}" -o "cs2d_${ver}_linux.zip"
if [ $? -ne 0 ]; then
    handle_error "Failed to download cs2d_${ver}_linux.zip."
fi

curl --progress-bar -S "https://unrealsoftware.de/files_pub/cs2d_dedicated_linux.zip" -o "cs2d_dedicated_linux.zip"
if [ $? -ne 0 ]; then
    handle_error "Failed to download cs2d_dedicated_linux.zip."
fi

# Unzip the downloaded files
echo "Unzipping files..."
unzip -qq -o "cs2d_${ver}_linux.zip" || handle_error "Failed to unzip cs2d_${ver}_linux.zip."
unzip -qq -o "cs2d_dedicated_linux.zip" || handle_error "Failed to unzip cs2d_dedicated_linux.zip."

# Clean up unnecessary files
echo "Cleaning up..."
rm -f "cs2d_${ver}_linux.zip" "cs2d_dedicated_linux.zip" CS2D libsteam_api.so maps/temp.map
rm -f sys/autobuy.cfg sys/autoexec.cfg sys/config.cfg sys/controls.cfg sys/editor.cfg sys/filters.cfg sys/mods.cfg
rm -f sys/controls.lst sys/favorites.lst sys/maptypes.lst
rm -f sys/core/dls.cache sys/core/svl.cache sys/core/version.cfg
rm -rf help logos screens gfx/fonts sys/cache sys/language

# Make the CS2D dedicated server executable
chmod +x cs2d_dedicated || handle_error "Failed to make cs2d_dedicated executable."

echo "CS2D server files downloaded and extracted successfully."
