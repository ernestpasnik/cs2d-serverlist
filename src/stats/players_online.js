class PlayerCountService {
  constructor() {
    this.playerCounts = {
      steam: null,
      unrealSoftware: null
    };
    this.pollingInterval = 300000; // 5 min
    this.intervals = [];
  }

  async fetchSteamPlayers() {
    try {
      const response = await fetch('http://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=666220');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.playerCounts.steam = data?.response?.player_count ?? 0;
      
      return this.playerCounts.steam;
    } catch (error) {
      console.error(error.message);	
      this.playerCounts.steam = 0;
      return 0;
    }
  }

  async fetchUnrealSoftwarePlayers() {
    try {
      const response = await fetch('http://217.154.200.83/users.php?p=1');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const match = html.match(/(\d+)\s+Users?/i);
      this.playerCounts.unrealSoftware = match ? parseInt(match[1], 10) : 0;
      
      return this.playerCounts.unrealSoftware;
    } catch (error) {
      console.error(error.message);
      this.playerCounts.unrealSoftware = 0;
      return 0;
    }
  }

  async initialize() {
    await Promise.allSettled([
      this.fetchSteamPlayers(),
      this.fetchUnrealSoftwarePlayers()
    ]);
  }

  startPolling() {
    this.initialize();
    this.intervals = [
      setInterval(() => this.fetchSteamPlayers(), this.pollingInterval),
      setInterval(() => this.fetchUnrealSoftwarePlayers(), this.pollingInterval)
    ];
  }

  stopPolling() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  getPlayerCounts() {
    return {
      steam: this.playerCounts.steam ?? 'N/A',
      unrealSoftware: this.playerCounts.unrealSoftware ?? 'N/A'
    };
  }
}

const playerService = new PlayerCountService();
playerService.startPolling();

export const getPlayersOnline = () => playerService.getPlayerCounts();
export default playerService;