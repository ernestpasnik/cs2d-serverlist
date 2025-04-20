local dir_sep = package.config:sub(1, 1)
local page = "https://cs2d.pp.ua/api/upload"
local file = game("stats_folder") .. dir_sep .. "userstats.dat"
local port = game("port")
local sort = game("stats_sort")
local curl = string.format(
		"curl -X POST \"%s\" -F \"file=@%s\" -F \"port=%s\" -F \"sort=%s\" " ..
		"> /dev/null 2>&1 &", page, file, port, sort)

function upload_leaderboard()
	print(curl)
	os.execute(curl)
	timer(900000, "upload_leaderboard")
end

upload_leaderboard()
