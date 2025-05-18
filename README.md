# CS2D Server List
A Node.js app that displays the scoreboard, server details, and other real-time information. Includes an easy-to-use API to access CS2D server data and upload leaderboard stats. The API provides consistent JSON responses, unlimited usage, and public access with CORS enabled.

Currently hosted at: [cs2d.pp.ua](https://cs2d.pp.ua)

## ENV Configuration
Below are the environment variables used to configure the application, along with their default values:
| **Variable**    | **Description**                                         | **Default Value**        |
| --------------- | ------------------------------------------------------- | ------------------------ |
| `HOST`          | Address to bind the server to                           | `0.0.0.0`                |
| `PORT`          | Port for the server to listen on                        | `3000`                   |
| `NODE_ENV`      | Defines the application environment                     | `development`            |
| `REDIS_URL`     | URL for connecting to the Redis server                  | `redis://127.0.0.1:6379` |
| `IPINFO_APIKEY` | [API key for IP geolocation service](https://ipinfo.io) | *Not set*                |

## Nginx Configuration
Example Nginx configurations are available in the [`config/nginx`](config/nginx) directory. These templates cover a range of common use cases, such as Cloudflare proxy settings, SSL configurations, and more. You can easily modify them to suit your specific requirements.

## License
This project is licensed under the [MIT License](LICENSE).
