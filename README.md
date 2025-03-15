
# Symfony + PWA = 💕

## Introduction

This application is a PWA (Progressive Web Application) built with Symfony and PHPWA.

## Getting Started

### With Docker

1. If not already done, [install Docker Compose](https://docs.docker.com/compose/install/) (v2.10+)
2. Run `castor build` to build fresh images
3. Run `castor start` to start the project
4. Open `https://localhost` in your favorite web browser and [accept the auto-generated TLS certificate](https://stackoverflow.com/a/15076602/1352334)
5. Run `castor stop` to stop the Docker containers.

### With Symfony CLI

If not already done, [install Symfony CLI](https://symfony.com/download).

You can also install the TLS certificates to have HTTPS working out of the box: `symfony server:ca:install`

1. Run `git clone git@github.com:Spomky-Labs/phpwa-demo.git && cd phpwa-demo` to clone the demo and move to the created folder
2. Run `composer install` to install the dependencies
3. Run `symfony console assets:install` to install the assets
4. Run `symfony console importmap:install` to install frontend dependencies
5. Run `symfony console tailwind:build` to build the frontend assets
6. Run `symfony console asset-map:compile` to compile the assets
7. Run `symfony server:start` to start the project
8. Run `symfony open:local` to open the app in your default web browser. Alternatively, you can go the http://localhost:8000
9. Run `symfony server:stop` to stop the server

## License

It is available under the MIT License.
