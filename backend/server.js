const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// --- İŞ TAKİP SİSTEMİ ---
const jobs = {}; // Basit bir in-memory iş deposu

const updateJobStatus = (jobId, message, progress, downloadPath = null) => {
    if (jobs[jobId]) {
        jobs[jobId].status = 'processing';
        jobs[jobId].message = message;
        jobs[jobId].progress = progress;
        jobs[jobId].timestamp = Date.now();
        if (downloadPath) {
            jobs[jobId].status = 'completed';
            jobs[jobId].downloadPath = downloadPath;
        }
        console.log(`İş Güncellemesi [${jobId}]: ${message} @ ${progress}%`);
    }
};

const failJob = (jobId, errorMessage) => {
    if (jobs[jobId]) {
        jobs[jobId].status = 'failed';
        jobs[jobId].message = errorMessage;
        jobs[jobId].progress = 100;
        jobs[jobId].timestamp = Date.now();
        console.error(`İş Başarısız [${jobId}]: ${errorMessage}`);
    }
};

// Eski işleri periyodik olarak temizle
setInterval(() => {
    const now = Date.now();
    for (const jobId in jobs) {
        if (now - jobs[jobId].timestamp > 1000 * 60 * 30) { // 30 dakikadan eski işleri sil
            const job = jobs[jobId];
            cleanupFiles(job.downloadPath, job.inputPath, ...(job.tempFiles || []));
            delete jobs[jobId];
            console.log(`Eski iş temizlendi: ${jobId}`);
        }
    }
}, 1000 * 60 * 5);


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Buffer.from(file.originalname, 'latin1').toString('utf8')}`)
});
const upload = multer({ storage });

const cleanupFiles = (...files) => {
    files.forEach(file => {
        if (file && fs.existsSync(file)) {
            fs.unlink(file, err => {
                if (err) console.error(`Dosya silinemedi: ${file}`, err);
            });
        }
    });
};

app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    
    const outputFormat = req.body.format;
    if (!outputFormat) return res.status(400).json({ message: 'Hedef format belirtilmedi.' });

    const jobId = crypto.randomUUID();
    
    jobs[jobId] = {
        status: 'queued',
        message: 'Sırada bekliyor...',
        progress: 0,
        originalName: req.file.originalname,
        outputFormat: outputFormat,
        timestamp: Date.now(),
        inputPath: req.file.path,
        outputPath: path.join(uploadDir, `${jobId}.${outputFormat}`),
        tempFiles: []
    };
    
    // İşlemi hemen başlat ama bitmesini bekleme (asenkron)
    routeConversion(jobId).catch(error => {
        failJob(jobId, error.message || 'Bilinmeyen bir sunucu hatası oluştu.');
        cleanupFiles(jobs[jobId].inputPath);
    });

    res.status(202).json({ jobId });
});

app.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ message: 'İş bulunamadı.' });
    res.json(job);
});

app.get('/download/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job || job.status !== 'completed' || !job.downloadPath) {
        return res.status(404).json({ message: 'Dosya hazır değil veya bulunamadı.' });
    }

    const originalName = path.parse(job.originalName).name;
    const newName = `${originalName}.${job.outputFormat}`;

    res.download(job.downloadPath, newName, (err) => {
        if (err) console.error(`İndirme hatası [${req.params.jobId}]:`, err);
        
        cleanupFiles(job.inputPath, job.downloadPath, ...(job.tempFiles || []));
        delete jobs[req.params.jobId];
    });
});

async function routeConversion(jobId) {
    const job = jobs[jobId];
    if (!job) throw new Error("İş bilgisi bulunamadı.");

    updateJobStatus(jobId, 'Dönüşüm türü belirleniyor...', 5);
    
    const { inputPath, outputPath, originalName, outputFormat } = job;
    const inputExt = path.extname(originalName).substring(1).toLowerCase();
    
    const is = (type, format) => {
        const types = {
            image: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'svg', 'gif'],
            video: ['mp4', 'mkv', 'webm', 'mov', 'avi'],
            audio: ['mp3', 'wav', 'ogg', 'flac'],
            document: ['pdf', 'docx', 'odt', 'rtf', 'pptx', 'odp'],
            markup: ['html', 'md', 'txt'],
            ebook: ['epub', 'mobi'],
            spreadsheet: ['csv', 'xlsx', 'xls'],
            tex: ['tex']
        };
        return types[type] ? types[type].includes(format) : false;
    };

    const inputType = Object.keys(is).find(key => is(key, inputExt)) || 'unknown';

    // PDF'ten Çevrim Operasyonları
    if (inputType === 'pdf') {
        if (is('image', outputFormat)) return convertWithImageMagick(jobId);
        if (is('document', outputFormat) && outputFormat === 'docx') return convertPdfToDocx(jobId);
        if (is('markup', outputFormat)) return convertPdfToMarkup(jobId);
        if (is('tex', outputFormat)) return convertPdfToTex(jobId);
        if (is('spreadsheet', outputFormat) && outputFormat === 'csv') return convertPdfToCsv(jobId);
    }
    
    // Dokümanlardan Çevrim Operasyonları
    if (inputType === 'document') {
        if (is('image', outputFormat)) return convertDocToImage(jobId);
        if (is('document', outputFormat) || is('pdf', outputFormat) || is('spreadsheet', outputFormat)) return convertWithLibreOffice(jobId);
        if (is('markup', outputFormat) || is('ebook', outputFormat) || is('tex', outputFormat)) return convertWithPandoc(jobId);
    }
    
    // Diğer Çevrimler
    if (is('video', inputType) || is('audio', inputType)) {
        if (is('video', outputFormat) || is('audio', outputFormat) || outputFormat === 'gif') return convertWithFfmpeg(jobId);
    }
    if (is('image', inputType) && is('image', outputFormat)) return convertWithImageMagick(jobId);
    if (is('spreadsheet', inputType) && (is('spreadsheet', outputFormat) || is('pdf', outputFormat))) return convertWithLibreOffice(jobId);
    if (is('markup', inputType) || is('tex', inputType)) {
        if (is('markup', outputFormat) || is('document', outputFormat) || is('pdf', outputFormat) || is('ebook', outputFormat) || is('tex', outputFormat)) return convertWithPandoc(jobId);
    }
    if (is('ebook', inputType)) {
        if (is('ebook', outputFormat) || is('document', outputFormat) || is('pdf', outputFormat) || is('markup', outputFormat)) return convertWithCalibre(jobId);
    }

    failJob(jobId, `Dönüşüm desteklenmiyor: '${inputExt}' formatından '${outputFormat}' formatına.`);
    cleanupFiles(inputPath);
}


const runCommand = (command, toolName, jobId) => {
    return new Promise((resolve, reject) => {
        console.log(`[${jobId}] ${toolName} çalıştırılıyor:`, command);
        const process = exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${jobId}] ${toolName} exec error:`, stderr || stdout);
                return reject(new Error(`${toolName} hatası: ${stderr || error.message}`));
            }
            resolve(stdout);
        });
    });
};

// --- ÇOK AŞAMALI OPERASYONLAR ---

async function convertPdfToDocx(jobId) {
    const { inputPath, outputPath, tempFiles } = jobs[jobId];
    const tempHtmlPath = `${inputPath}.html`;
    tempFiles.push(tempHtmlPath);

    updateJobStatus(jobId, 'Aşama 1/2: PDF yapısı çıkarılıyor...', 25);
    const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler (pdftohtml)', jobId);
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    updateJobStatus(jobId, 'Aşama 2/2: Word belgesi oluşturuluyor...', 75);
    await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId);
    
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertPdfToTex(jobId) {
    const { inputPath, outputPath, tempFiles } = jobs[jobId];
    const tempTxtPath = `${inputPath}.txt`;
    tempFiles.push(tempTxtPath);

    updateJobStatus(jobId, 'Aşama 1/2: PDF metni çıkarılıyor...', 25);
    const extractedText = await runCommand(`pdftotext -layout "${inputPath}" -`, 'Poppler (pdftotext)', jobId);
    fs.writeFileSync(tempTxtPath, extractedText);
    
    updateJobStatus(jobId, 'Aşama 2/2: LaTeX kodu oluşturuluyor...', 75);
    await runCommand(`pandoc "${tempTxtPath}" -f commonmark -o "${outputPath}"`, 'Pandoc', jobId);

    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertPdfToCsv(jobId) {
    const { inputPath, outputPath, tempFiles } = jobs[jobId];
    const tempHtmlPath = `${inputPath}.html`;
    tempFiles.push(tempHtmlPath);

    updateJobStatus(jobId, 'Aşama 1/2: PDF tablosu aranıyor...', 25);
    const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler (pdftohtml)', jobId);
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    updateJobStatus(jobId, 'Aşama 2/2: CSV dosyası oluşturuluyor...', 75);
    await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId);

    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertPdfToMarkup(jobId) {
    const { inputPath, outputPath, tempFiles } = jobs[jobId];
    const tempTxtPath = `${inputPath}.txt`;
    tempFiles.push(tempTxtPath);
    
    updateJobStatus(jobId, 'Aşama 1/2: PDF metni çıkarılıyor...', 25);
    const popplerCommand = `pdftotext -layout "${inputPath}" -`;
    const extractedText = await runCommand(popplerCommand, 'Poppler (pdftotext)', jobId);
    fs.writeFileSync(tempTxtPath, extractedText);
    
    updateJobStatus(jobId, 'Aşama 2/2: Markup oluşturuluyor...', 75);
    const pandocCommand = `pandoc "${tempTxtPath}" -f commonmark -o "${outputPath}"`;
    await runCommand(pandocCommand, 'Pandoc', jobId);

    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertDocToImage(jobId) {
    const { inputPath, outputPath, tempFiles } = jobs[jobId];
    
    updateJobStatus(jobId, 'Aşama 1/2: Belge PDF\'e çevriliyor...', 25);
    const tempPdfPath = await convertToPdfWithLibreOffice(jobId, inputPath);
    tempFiles.push(tempPdfPath);
    
    updateJobStatus(jobId, 'Aşama 2/2: Resim oluşturuluyor...', 75);
    jobs[jobId].inputPath = tempPdfPath; // ImageMagick'in PDF'i işlemesi için girdi dosyasını değiştiriyoruz
    await convertWithImageMagick(jobId);
    
    // Orijinal inputPath'i de temizleme listesine ekle
    jobs[jobId].tempFiles.push(inputPath);
}

// --- UZMAN FONKSİYONLAR ---

function convertToPdfWithLibreOffice(jobId, customInputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const inputPath = customInputPath || jobs[jobId].inputPath;
            const command = `soffice --headless --convert-to pdf --outdir ${uploadDir} "${inputPath}"`;
            await runCommand(command, 'LibreOffice (PDF)', jobId);
            const expectedPdfPath = path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.pdf`);
            resolve(expectedPdfPath);
        } catch (error) {
            reject(error);
        }
    });
}

async function convertWithLibreOffice(jobId) {
    const { inputPath, outputPath } = jobs[jobId];
    updateJobStatus(jobId, 'LibreOffice ile dönüştürülüyor...', 15);
    const outputFormat = path.extname(outputPath).substring(1);
    const command = `soffice --headless --convert-to ${outputFormat} --outdir ${uploadDir} "${inputPath}"`;
    await runCommand(command, 'LibreOffice', jobId);
    const expectedOutputPath = path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.${outputFormat}`);
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, expectedOutputPath);
}

async function convertWithImageMagick(jobId) {
    const { inputPath, outputPath } = jobs[jobId];
    updateJobStatus(jobId, 'ImageMagick ile dönüştürülüyor...', 15);
    const source = inputPath.toLowerCase().endsWith('.pdf') ? `${inputPath}[0]` : inputPath;
    const command = `convert -density 300 "${source}" -quality 100 -background white -alpha remove -alpha off -trim "${outputPath}"`;
    
    await runCommand(command, 'ImageMagick', jobId);
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertWithFfmpeg(jobId) {
    const { inputPath, outputPath, outputFormat } = jobs[jobId];
    updateJobStatus(jobId, 'FFmpeg ile dönüştürülüyor...', 15);

    const inputFormat = path.extname(jobs[jobId].originalName).substring(1).toLowerCase();
    let command;

    if ((inputFormat === 'mkv' && outputFormat === 'mp4') || (inputFormat === 'mp4' && outputFormat === 'mkv')) {
        command = `ffmpeg -i "${inputPath}" -c copy -y "${outputPath}"`;
        try {
            await runCommand(command, 'FFmpeg (Remux)', jobId);
            updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
            return;
        } catch (remuxErr) {
            console.warn(`[${jobId}] Remux başarısız, yeniden kodlamaya geçiliyor.`);
            updateJobStatus(jobId, 'Codec uyumsuz, yeniden kodlanıyor...', 20);
        }
    }

    if (outputFormat === 'gif') {
        command = `ffmpeg -i "${inputPath}" -vf "fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "${outputPath}"`;
    } else {
        command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -y "${outputPath}"`;
    }

    await runCommand(command, `FFmpeg (${outputFormat} Encode)`, jobId);
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertWithPandoc(jobId) {
    const { inputPath, outputPath } = jobs[jobId];
    updateJobStatus(jobId, 'Pandoc ile dönüştürülüyor...', 15);
    const command = `pandoc "${inputPath}" -s -o "${outputPath}"`;
    await runCommand(command, 'Pandoc', jobId);
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

async function convertWithCalibre(jobId) {
    const { inputPath, outputPath } = jobs[jobId];
    updateJobStatus(jobId, 'Calibre ile dönüştürülüyor...', 15);
    const command = `ebook-convert "${inputPath}" "${outputPath}"`;
    await runCommand(command, 'Calibre', jobId);
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
}

app.listen(port, () => console.log(`Sunucu ${port} portunda çalışıyor.`));

