FROM php:8.3-apache

RUN docker-php-ext-install mysqli \
    && a2enmod rewrite

COPY . /var/www/html/

RUN sed -i 's/80/${PORT}/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 8080

CMD ["sh", "-c", "sed -i \"s/80/$PORT/g\" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
