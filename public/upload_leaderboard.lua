--[[ 
    Leaderboard Sync Script
    - Uploads user stats to a remote server if changed.
    - Runs every 15 minutes when no human players are online.
--]]

-- Configuration and file paths
local PATH_SEPARATOR = package.config:sub(1, 1)
local SERVER_PORT = game("port")
local SORT_TYPE = game("stats_sort")
local STATS_DIR = game("stats_folder") .. PATH_SEPARATOR
local STATS_FILE = STATS_DIR .. "userstats.dat"
local CHECKSUM_FILE = STATS_DIR .. "checksum.txt"
local UPLOAD_ENDPOINT = "https://cs2d.pp.ua/api/upload"

-- Construct curl command for uploading stats
local function generate_upload_command()
    return string.format(
        'curl -s -4 "%s" -F "file=@%s" -F "port=%s" -F "sort=%s"',
        UPLOAD_ENDPOINT, STATS_FILE, SERVER_PORT, SORT_TYPE
    )
end

-- Read the last stored checksum from file
local function read_checksum()
    local file = io.open(CHECKSUM_FILE, "r")
    if not file then return "" end
    local value = file:read("*l")
    file:close()
    return value
end

-- Write checksum to file
local function write_checksum(value)
    local file = io.open(CHECKSUM_FILE, "w")
    if file then
        file:write(value)
        file:close()
    end
end

-- Upload leaderboard if no human players are present and file has changed
local function sync_leaderboard()
    -- Skip upload if any human players are online
    for _, id in pairs(player(0, "table")) do
        if not player(id, "bot") then return end
    end

    local current_checksum = checksumfile(STATS_FILE)
    if current_checksum == LAST_CHECKSUM then return end

    LAST_CHECKSUM = current_checksum
    write_checksum(current_checksum)
    os.execute(generate_upload_command())
end

-- Initialize checksum and schedule recurring uploads every 15 minutes
local LAST_CHECKSUM = read_checksum()
timer(900000, "sync_leaderboard", "", 0)
sync_leaderboard()