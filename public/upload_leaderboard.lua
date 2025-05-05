-- Setup config and file paths
local sep = package.config:sub(1, 1)
local port = game("port")
local sort = game("stats_sort")
local path = game("stats_folder") .. sep
local userstats_file = path .. "userstats.dat"
local checksum_file = path .. "checksum.txt"

-- Upload target and curl command
local url = "https://cs2d.pp.ua/api/upload"
local cmd = string.format(
	'curl -s -4 "%s" -F "file=@%s" -F "port=%s" -F "sort=%s"',
	url, userstats_file, port, sort
)

-- Load last checksum from file
local function load_last_checksum()
	local f = io.open(checksum_file, "r")
	if not f then return "" end
	local checksum = f:read("*l")
	f:close()
	return checksum
end

-- Save checksum to file
local function save_last_checksum(checksum)
	local f = io.open(checksum_file, "w")
	if not f then return end
	f:write(checksum)
	f:close()
end

-- Upload when no players in-game and the file is updated
function upload_leaderboard()
	for _, id in pairs(player(0, "table")) do
		if not player(id, "bot") then return end
	end

	local current = checksumfile(userstats_file)
	if current == last_checksum then return end

	last_checksum = current
	save_last_checksum(current)
	os.execute(cmd)
end

-- Initialize checksum, schedule every 15 minutes and run
local last_checksum = load_last_checksum()
timer(900000, "upload_leaderboard", "", 0)
upload_leaderboard()
