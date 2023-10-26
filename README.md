# PAC Backend

## Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)

## Getting Started Locally

- create `.env` file, please refer to `.env.example` for guidance
- run postgres locally using `docker compose up -d`
- install the dependencies with `yarn` or `npm install`
- start an application with `yarn dev` or `npm run dev`

## Initial DB

- run `prisma migrate dev` to create db
- them, run `prisma generate` to generate prisma client

## Access to swagger

- start an ppalication with `yarn dev`
- go to url : `https://localhost:3000/docs`

## Setting up NGINX

- [Setting up SSL](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04)
- [Setting up Reverse Proxy](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-on-ubuntu-22-04)
- Adding nginx rules at `/etc/nginx/sites-availables/default`

```
server {
  server_name o.pacmon.suijin.xyz; # managed by Certbot

	location /api {
    rewrite ^/api/?(.*)$ /$1 break;
    proxy_pass  http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
	location /rpc/ {
    rewrite ^/rpc/?(.*)$ /$1 break;
    proxy_pass  http://127.0.0.1:8545/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}

  listen [::]:443 ssl ipv6only=on; # managed by Certbot
  listen 443 ssl; # managed by Certbot
  ssl_certificate /etc/letsencrypt/live/o.pacmon.suijin.xyz/fullchain.pem; # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/o.pacmon.suijin.xyz/privkey.pem; # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
  if ($host = o.pacmon.suijin.xyz) {
    return 301 https://$host$request_uri;
  } # managed by Certbot

	listen 80 ;
	listen [::]:80 ;
    server_name o.pacmon.suijin.xyz;
    return 404; # managed by Certbot
}
```
