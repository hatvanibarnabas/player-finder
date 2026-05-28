FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
RUN apt-get update && apt-get install -y libcurl4-openssl-dev \
    && docker-php-ext-install curl
RUN a2enmod headers rewrite
COPY . /var/www/html
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80