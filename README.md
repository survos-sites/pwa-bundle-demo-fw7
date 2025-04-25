# PWA Bundle Demo with Framework7

This application is a PWA (Progressive Web Application) built with Symfony and spomky-labs/pwa-bundle and Framework7.

This is a fork of tacman/phpwa-demo, which itself is a fork of the original phpwa-demo.

The initial difference is that instead of tailwind we're using Framework7.  Underneath it all is pwa-bundle

# Symfony + PWA + FW7 = 💕

## Installation

If not already done, [install Symfony CLI](https://symfony.com/download).

```bash
git clone git@github.com:survos/pwa-bundle-demo-fw7.git pwa-f7 && cd pwa-f7
composer install
symfony server:start -d
symfony open:local
```


## License

It is available under the MIT License.

## Getting Started (Docker)
### With Docker (untested)

1. If not already done, [install Docker Compose](https://docs.docker.com/compose/install/) (v2.10+)
2. Run `castor build` to build fresh images
3. Run `castor start` to start the project
4. Open `https://localhost` in your favorite web browser and [accept the auto-generated TLS certificate](https://stackoverflow.com/a/15076602/1352334)
5. Run `castor stop` to stop the Docker containers.

