# CS2D Server List
A Node.js app that displays the scoreboard, server details, and other real-time information. Includes an easy-to-use API to access CS2D server data and upload leaderboard stats. The API provides consistent JSON responses, unlimited usage, and public access with CORS enabled.

Currently hosted at: [cs2d.pp.ua](https://cs2d.pp.ua)

## ENV Configuration
Below are the environment variables used to configure the application, along with their default values if not explicitly set in the .env file.
| **Variable**    | **Description**                                         | **Default Value**        |
| --------------- | ------------------------------------------------------- | ------------------------ |
| `HOST`          | Address to bind the server to                           | `0.0.0.0`                |
| `PORT`          | Port for the server to listen on                        | `3000`                   |
| `REDIS_URL`     | URL for connecting to the Redis server                  | `redis://127.0.0.1:6379` |
| `NODE_ENV`      | Defines the application environment                     | `development`            |
| `IPINFO_APIKEY` | [API key for IP geolocation service](https://ipinfo.io) | *Not set*                |

## NGINX Configuration
If you are using NGINX as a reverse proxy, you should add the following:
- Block bots from accessing `/api/` by serving a custom `robots.txt`
- Enable CORS for API requests
```conf
location = /robots.txt {
    default_type text/plain;
    return 200 "User-agent: *\nDisallow: /api/\n";
}

location ~ ^/api/.*$ {
    proxy_pass http://127.0.0.1:3000;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET';
}
```

## License
This project is licensed under the [MIT License](LICENSE).
