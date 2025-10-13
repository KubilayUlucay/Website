const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const archiver = require('archiver');

// --- BOT & SUNUCU KURULUMU ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const cleanupFiles = (...files) => { files.forEach(file => { if (file && fs.existsSync(file)) { fs.unlink(file, err => { if (err) console.error(`Dosya silinemedi: ${file}`, err); }); } }); };

// Sticker Maker ve Telegram için Multer instance'ı
const stickerUpload = multer({ storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadDir), filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) }) });

// Sadece token varsa botu ve webhook'u ayarla
if (token) {
    const bot = new TelegramBot(token);
    const webhookPath = `/api/telegram/webhook/${token}`;
    const serviceUrl = process.env.SERVICE_URL;

    if (serviceUrl) {
         bot.setWebHook(`${serviceUrl}${webhookPath}`);
         console.log(`Telegram webhook ayarlandı: ${serviceUrl}${webhookPath}`);
    } else {
        console.warn("UYARI: SERVICE_URL ortam değişkeni ayarlanmamış. Webhook ayarlanamadı!");
    }

    app.post(webhookPath, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    const userStickerPacks = {};

    bot.on('message', (msg) => {
        if (msg.document || msg.photo) {
            handleStickerMessage(msg);
        } else if (msg.text && msg.text.startsWith('/start')) {
            bot.sendMessage(msg.chat.id, `Merhaba! Web sitemizdeki Sticker Maker aracını kullanarak oluşturduğun sticker'ları bana gönderebilirsin. Kullanıcı ID'n: ${msg.from.id}`);
        } else {
            bot.sendMessage(msg.chat.id, "Lütfen bana sticker yapmak istediğin bir PNG dosyası gönder veya /start komutu ile Kullanıcı ID'ni öğren.");
        }
    });

    async function handleStickerMessage(msg, filePath = null) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        let localFilePath = filePath;
        
        try {
            if (!localFilePath) { 
                 let fileId;
                if (msg.document && msg.document.mime_type === 'image/png') { fileId = msg.document.file_id; }
                else if (msg.photo) { fileId = msg.photo[msg.photo.length - 1].file_id; }
                else { bot.sendMessage(chatId, "Lütfen 512x512 boyutlarında bir PNG dosyası gönderin."); return; }
                
                bot.sendMessage(chatId, "Sticker'ın işleniyor, lütfen bekle...");
                localFilePath = await bot.downloadFile(fileId, uploadDir);
            }
            
            if (!userStickerPacks[userId]) {
                const packName = `user${userId}_by_UlucayStickerBot`;
                const packTitle = `${(msg.from.first_name || 'Web User')}'s Stickers`;
                
                await bot.createNewStickerSet(userId, packName, packTitle, localFilePath, '👍');
                userStickerPacks[userId] = packName;
                console.log(`Yeni sticker paketi oluşturuldu: ${packName} - Kullanıcı: ${userId}`);
                bot.sendMessage(chatId, `Harika! İşte sana özel sticker paketin: https://t.me/addstickers/${packName}`);
            
            } else {
                const packName = userStickerPacks[userId];
                await bot.addStickerToSet(userId, packName, localFilePath, '👍');
                console.log(`'${packName}' paketine yeni sticker eklendi.`);
                bot.sendMessage(chatId, `Sticker'ın paketine eklendi! Paketi görüntüle: https://t.me/addstickers/${packName}`);
            }
        } catch (error) {
            console.error("Telegram bot hatası:", error.response ? error.response.body : error);
            bot.sendMessage(chatId, "Üzgünüm, bir hata oluştu. Lütfen gönderdiğin dosyanın 512x512 boyutlarında ve 350KB'den küçük bir PNG olduğundan emin ol.");
        } finally {
            if (filePath && localFilePath) {
                cleanupFiles(localFilePath);
            }
        }
    }

    app.post('/upload-sticker', stickerUpload.single('sticker'), async (req, res) => {
        const { userId } = req.body;
        if (!req.file || !userId) {
            if(req.file) cleanupFiles(req.file.path);
            return res.status(400).json({ success: false, message: 'Eksik bilgi: sticker dosyası veya userId bulunamadı.' });
        }

        const fakeMsg = {
            chat: { id: userId }, 
            from: { id: userId, first_name: 'Web User' }
        };

        try {
            await handleStickerMessage(fakeMsg, req.file.path);
            res.json({ success: true, message: 'Sticker başarıyla bota gönderildi!' });
        } catch (e) {
            cleanupFiles(req.file.path);
            res.status(500).json({ success: false, message: 'Sticker bota gönderilirken bir hata oluştu.' });
        }
    });

} else {
    console.warn("UYARI: TELEGRAM_BOT_TOKEN ayarlanmamış. Telegram botu başlatılmayacak.");
}

// YENİ ENDPOINT: WhatsApp için sticker paketi oluşturma
app.post('/create-whatsapp-pack', stickerUpload.array('stickers', 30), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('Sticker dosyaları yüklenmedi.');
    }

    const packIdentifier = `ulucay_sticker_pack_${Date.now()}`;
    const packName = req.body.packName || 'My Stickers';
    const packPublisher = req.body.publisher || 'Ulucay.org';
    const filesToCleanup = req.files.map(f => f.path);
    const webpFiles = [];

    try {
        // Temsilci tepsi ikonu oluştur (96x96 PNG)
        const trayIconPath = path.join(uploadDir, `${packIdentifier}_tray.png`);
        await runCommand(`ffmpeg -i "${req.files[0].path}" -vf scale=96:96 "${trayIconPath}"`, 'FFmpeg');
        filesToCleanup.push(trayIconPath);

        // Tüm sticker'ları WEBP formatına çevir
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const webpPath = path.join(uploadDir, `${path.parse(file.filename).name}.webp`);
            await runCommand(`ffmpeg -i "${file.path}" -vf scale=512:512 "${webpPath}"`, 'FFmpeg');
            webpFiles.push({ path: webpPath, name: `${i}.webp` });
            filesToCleanup.push(webpPath);
        }

        // contents.json dosyasını oluştur
        const contents = {
            android_play_store_link: "",
            ios_app_store_link: "",
            sticker_packs: [{
                identifier: packIdentifier,
                name: packName,
                publisher: packPublisher,
                tray_image_file: "tray.png",
                stickers: webpFiles.map(f => ({ image_file: f.name, emojis: ["👍"] }))
            }]
        };

        // ZIP dosyasını oluştur
        const zipPath = path.join(uploadDir, `${packIdentifier}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipPath, 'WhatsApp_Stickers.zip', (err) => {
                if(err) console.error("ZIP indirme hatası:", err);
                filesToCleanup.push(zipPath);
                cleanupFiles(...filesToCleanup);
            });
        });
        
        archive.on('error', err => { throw err; });
        archive.pipe(output);
        archive.file(trayIconPath, { name: 'tray.png' });
        archive.append(JSON.stringify(contents), { name: 'contents.json' });
        webpFiles.forEach(file => archive.file(file.path, { name: file.name }));
        await archive.finalize();

    } catch (error) {
        console.error("WhatsApp paketi oluşturma hatası:", error);
        cleanupFiles(...filesToCleanup);
        res.status(500).send('Sticker paketi oluşturulurken bir hata oluştu.');
    }
});


// --- DOSYA DÖNÜŞTÜRÜCÜ ---
const converterUpload = multer({ storage: multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadDir), filename: (req, file, cb) => cb(null, `${Date.now()}-${Buffer.from(file.originalname, 'latin1').toString('utf8')}`) }) });

app.post('/convert', converterUpload.single('file'), (req, res) => { 
    if (!req.file) return res.status(400).json({ message: 'Dosya yüklenmedi.' }); 
    const outputFormat = req.body.format; 
    if (!outputFormat) return res.status(400).json({ message: 'Hedef format belirtilmedi.' }); 
    const jobId = crypto.randomUUID(); 
    jobs[jobId] = { status: 'queued', message: 'Sırada bekliyor...', progress: 0, originalName: req.file.originalname, outputFormat: outputFormat, timestamp: Date.now(), inputPath: req.file.path, outputPath: path.join(uploadDir, `${jobId}.${outputFormat}`), tempFiles: [] }; 
    routeConversion(jobId).catch(error => { failJob(jobId, error.message || 'Bilinmeyen bir sunucu hatası oluştu.'); cleanupFiles(jobs[jobId].inputPath); }); 
    res.status(202).json({ jobId }); 
});
app.get('/status/:jobId', (req, res) => { const job = jobs[req.params.jobId]; if (!job) return res.status(404).json({ message: 'İş bulunamadı.' }); res.json(job); });
app.get('/download/:jobId', (req, res) => { 
    const job = jobs[req.params.jobId]; 
    if (!job || job.status !== 'completed' || !job.downloadPath) { return res.status(404).json({ message: 'Dosya hazır değil veya bulunamadı.' }); } 
    const originalName = path.parse(job.originalName).name; 
    const newName = `${originalName}.${job.outputFormat}`; 
    res.download(job.downloadPath, newName, (err) => { 
        if (err) console.error(`İndirme hatası [${req.params.jobId}]:`, err); 
        cleanupFiles(job.inputPath, job.downloadPath, ...(job.tempFiles || [])); 
        delete jobs[req.params.jobId]; 
    }); 
});
const updateJobStatus = (jobId, message, progress, downloadPath = null) => { if (jobs[jobId]) { jobs[jobId].status = 'processing'; jobs[jobId].message = message; jobs[jobId].progress = progress; jobs[jobId].timestamp = Date.now(); if (downloadPath) { jobs[jobId].status = 'completed'; jobs[jobId].downloadPath = downloadPath; } } };
const failJob = (jobId, errorMessage) => { if (jobs[jobId]) { jobs[jobId].status = 'failed'; jobs[jobId].message = errorMessage; } };
async function routeConversion(jobId) { 
    const job = jobs[jobId];
    if (!job) throw new Error("İş bilgisi bulunamadı.");
    const { inputPath, originalName, outputFormat } = job;
    const inputExt = path.extname(originalName).substring(1).toLowerCase();
    const is = (type, format) => {
        const types = {
            image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'svg', 'gif'], video: ['mp4', 'mkv', 'webm', 'mov', 'avi'],
            audio: ['mp3', 'wav', 'ogg', 'flac'], document: ['pdf', 'docx', 'odt', 'rtf', 'pptx', 'odp'],
            markup: ['html', 'md', 'txt'], ebook: ['epub', 'mobi'], spreadsheet: ['csv', 'xlsx', 'xls'], tex: ['tex']
        };
        return types[type] ? types[type].includes(format) : false;
    };
    const inputType = Object.keys(is).find(key => is(key, inputExt)) || 'unknown';

    updateJobStatus(jobId, 'Dönüşüm türü belirleniyor...', 5);
    if (inputType === 'pdf') {
        if (is('image', outputFormat)) return convertWithImageMagick(jobId);
        if (is('document', outputFormat) && outputFormat === 'docx') return convertPdfToDocx(jobId);
        if (is('markup', outputFormat)) return convertPdfToMarkup(jobId);
        if (is('tex', outputFormat)) return convertPdfToTex(jobId);
        if (is('spreadsheet', outputFormat) && outputFormat === 'csv') return convertPdfToCsv(jobId);
    }
    if (inputType === 'document') {
        if (is('image', outputFormat)) return convertDocToImage(jobId);
        if (is('document', outputFormat) || is('pdf', outputFormat) || is('spreadsheet', outputFormat)) return convertWithLibreOffice(jobId);
        if (is('markup', outputFormat) || is('ebook', outputFormat) || is('tex', outputFormat)) return convertWithPandoc(jobId);
    }
    if (is('video', inputType) || is('audio', inputType)) { if (is('video', outputFormat) || is('audio', outputFormat) || outputFormat === 'gif') return convertWithFfmpeg(jobId); }
    if (is('image', inputType) && is('image', outputFormat)) return convertWithImageMagick(jobId);
    if (is('spreadsheet', inputType) && (is('spreadsheet', outputFormat) || is('pdf', outputFormat))) return convertWithLibreOffice(jobId);
    if (is('markup', inputType) || is('tex', inputType)) { if (is('markup', outputFormat) || is('document', outputFormat) || is('pdf', outputFormat) || is('ebook', outputFormat) || is('tex', outputFormat)) return convertWithPandoc(jobId); }
    if (is('ebook', inputType)) { if (is('ebook', outputFormat) || is('document', outputFormat) || is('pdf', outputFormat) || is('markup', outputFormat)) return convertWithCalibre(jobId); }
    throw new Error(`Dönüşüm desteklenmiyor: '${inputType}' -> '${outputFormat}'.`);
}
const runCommand = (command, toolName, jobId) => { return new Promise((resolve, reject) => { exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => { if (error) { reject(new Error(`${toolName} hatası: ${stderr || error.message}`)); } else { resolve(stdout); } }); }); };
async function convertPdfToDocx(jobId) { const { inputPath, outputPath, tempFiles } = jobs[jobId]; const tempHtmlPath = `${inputPath}.html`; tempFiles.push(tempHtmlPath); updateJobStatus(jobId, 'Aşama 1/2: PDF yapısı çıkarılıyor...', 25); const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler', jobId); fs.writeFileSync(tempHtmlPath, htmlContent); updateJobStatus(jobId, 'Aşama 2/2: Word belgesi oluşturuluyor...', 75); await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertPdfToTex(jobId) { const { inputPath, outputPath, tempFiles } = jobs[jobId]; const tempTxtPath = `${inputPath}.txt`; tempFiles.push(tempTxtPath); updateJobStatus(jobId, 'Aşama 1/2: PDF metni çıkarılıyor...', 25); const extractedText = await runCommand(`pdftotext -layout "${inputPath}" -`, 'Poppler', jobId); fs.writeFileSync(tempTxtPath, extractedText); updateJobStatus(jobId, 'Aşama 2/2: LaTeX kodu oluşturuluyor...', 75); await runCommand(`pandoc "${tempTxtPath}" -f commonmark -o "${outputPath}"`, 'Pandoc', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertPdfToCsv(jobId) { const { inputPath, outputPath, tempFiles } = jobs[jobId]; const tempHtmlPath = `${inputPath}.html`; tempFiles.push(tempHtmlPath); updateJobStatus(jobId, 'Aşama 1/2: PDF tablosu aranıyor...', 25); const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler', jobId); fs.writeFileSync(tempHtmlPath, htmlContent); updateJobStatus(jobId, 'Aşama 2/2: CSV dosyası oluşturuluyor...', 75); await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertPdfToMarkup(jobId) { const { inputPath, outputPath, tempFiles } = jobs[jobId]; const tempTxtPath = `${inputPath}.txt`; tempFiles.push(tempTxtPath); updateJobStatus(jobId, 'Aşama 1/2: PDF metni çıkarılıyor...', 25); const extractedText = await runCommand(`pdftotext -layout "${inputPath}" -`, 'Poppler', jobId); fs.writeFileSync(tempTxtPath, extractedText); updateJobStatus(jobId, 'Aşama 2/2: Markup oluşturuluyor...', 75); await runCommand(`pandoc "${tempTxtPath}" -f commonmark -o "${outputPath}"`, 'Pandoc', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertDocToImage(jobId) { const { inputPath, outputPath, tempFiles } = jobs[jobId]; updateJobStatus(jobId, 'Aşama 1/2: Belge PDF\'e çevriliyor...', 25); const tempPdfPath = await convertToPdfWithLibreOffice(jobId, inputPath); tempFiles.push(tempPdfPath); updateJobStatus(jobId, 'Aşama 2/2: Resim oluşturuluyor...', 75); jobs[jobId].inputPath = tempPdfPath; await convertWithImageMagick(jobId); tempFiles.push(inputPath); }
async function convertWithLibreOffice(jobId) { const { inputPath, outputPath } = jobs[jobId]; updateJobStatus(jobId, 'LibreOffice ile dönüştürülüyor...', 15); const outputFormat = path.extname(outputPath).substring(1); const command = `soffice --headless --convert-to ${outputFormat} --outdir ${uploadDir} "${inputPath}"`; await runCommand(command, 'LibreOffice', jobId); const expectedOutputPath = path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.${outputFormat}`); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, expectedOutputPath); }
async function convertToPdfWithLibreOffice(jobId, customInputPath) { return new Promise(async (resolve, reject) => { try { const inputPath = customInputPath || jobs[jobId].inputPath; const command = `soffice --headless --convert-to pdf --outdir ${uploadDir} "${inputPath}"`; await runCommand(command, 'LibreOffice', jobId); resolve(path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.pdf`)); } catch (error) { reject(error); } }); }
async function convertWithImageMagick(jobId) { const { inputPath, outputPath } = jobs[jobId]; updateJobStatus(jobId, 'ImageMagick ile dönüştürülüyor...', 15); const source = inputPath.toLowerCase().endsWith('.pdf') ? `${inputPath}[0]` : inputPath; const command = `convert -density 300 "${source}" -quality 100 -background white -alpha remove -alpha off -trim "${outputPath}"`; await runCommand(command, 'ImageMagick', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertWithFfmpeg(jobId) { const { inputPath, outputPath, outputFormat, originalName } = jobs[jobId]; updateJobStatus(jobId, 'FFmpeg ile dönüştürülüyor...', 15); const inputFormat = path.extname(originalName).substring(1).toLowerCase(); let command; if ((inputFormat === 'mkv' && outputFormat === 'mp4') || (inputFormat === 'mp4' && outputFormat === 'mkv')) { command = `ffmpeg -i "${inputPath}" -c copy -y "${outputPath}"`; try { await runCommand(command, 'FFmpeg (Remux)', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); return; } catch (e) { updateJobStatus(jobId, 'Codec uyumsuz, yeniden kodlanıyor...', 20); } } command = outputFormat === 'gif' ? `ffmpeg -i "${inputPath}" -vf "fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "${outputPath}"` : `ffmpeg -i "${inputPath}" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -y "${outputPath}"`; await runCommand(command, `FFmpeg (Encode)`, jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertWithPandoc(jobId) { const { inputPath, outputPath } = jobs[jobId]; updateJobStatus(jobId, 'Pandoc ile dönüştürülüyor...', 15); await runCommand(`pandoc "${inputPath}" -s -o "${outputPath}"`, 'Pandoc', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }
async function convertWithCalibre(jobId) { const { inputPath, outputPath } = jobs[jobId]; updateJobStatus(jobId, 'Calibre ile dönüştürülüyor...', 15); await runCommand(`ebook-convert "${inputPath}" "${outputPath}"`, 'Calibre', jobId); updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath); }


app.listen(port, () => console.log(`Ana sunucu ${port} portunda çalışıyor.`));

