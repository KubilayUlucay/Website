# 1. Adım: Temel imaj olarak Node.js'in daha yetenekli bir sürümünü kullan
FROM node:18

# 2. Adım: Gerekli tüm uzman araçları container içine kur
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    libreoffice-writer \
    # === YENİ UZMANLIK: Spreadsheet (Excel, CSV) işlemleri için ===
    libreoffice-calc \
    ghostscript \
    pandoc \
    calibre \
    texlive-latex-base \
    poppler-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# ImageMagick PDF Güvenlik Politikasını Güncelleme
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="read|write" pattern="PDF" \/>/g' /etc/ImageMagick-6/policy.xml

# 3. Adım: Uygulama için bir çalışma dizini oluştur
WORKDIR /usr/src/app

# 4. Adım: Bağımlılıkları yükle
COPY package*.json ./
RUN npm install --only=production

# 5. Adım: Uygulama kodunu kopyala
COPY . .

# 6. Adım: Container başladığında çalıştırılacak komut
CMD [ "node", "server.js" ]

