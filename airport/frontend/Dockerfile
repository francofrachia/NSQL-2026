FROM nginx:alpine

# Eliminar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

EXPOSE 80
