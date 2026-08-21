FROM php:8.3-cli

RUN docker-php-ext-install mysqli

WORKDIR /app
COPY . /app

EXPOSE 8080
CMD php -S 0.0.0.0:${PORT:-8080} -t /app
