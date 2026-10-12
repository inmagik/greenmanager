FROM nginx:1.31.1

COPY ./dist /var/www
COPY ./nginx.conf.template /etc/nginx/templates/default.conf.template
# The template gets the DNS of the container, for the proxy of the orthophoto; no other variable is replaced.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER=^NGINX_LOCAL_RESOLVERS$

EXPOSE 80