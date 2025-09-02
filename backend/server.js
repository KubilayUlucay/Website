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

// --- YENİ: İş Takip Sistemi ---
const jobs = {}; // Basit bir in-memory iş deposu

const updateJobStatus = (jobId, status, progress, downloadPath = null) => {
    if (jobs[jobId]) {
        jobs[jobId].status = status;
        jobs[jobId].progress = progress;
        jobs[jobId].timestamp = Date.now();
        if (downloadPath) jobs[jobId].downloadPath = downloadPath;
        console.log(`İş Güncellemesi [${jobId}]: ${status} @ ${progress}%`);
    }
};

// Eski işleri periyodik olarak temizle (hafıza sızıntılarını önlemek için)
setInterval(() => {
    const now = Date.now();
    for (const jobId in jobs) {
        if (now - jobs[jobId].timestamp > 1000 * 60 * 30) { // 30 dakikadan eski işleri sil
            if(jobs[jobId].downloadPath) cleanupFiles(jobs[jobId].downloadPath);
            delete jobs[jobId];
            console.log(`Eski iş temizlendi: ${jobId}`);
        }
    }
}, 1000 * 60 * 5); // 5 dakikada bir çalış


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Buffer.from(file.originalname, 'latin1').toString('utf8')}`)
});
const upload = multer({ storage });

const cleanupFiles = (...files) => {
    files.forEach(file => {
        if (file) fs.unlink(file, err => {
            if (err) console.error(`Dosya silinemedi: ${file}`, err);
        });
    });
};

// GÜNCELLENDİ: /convert endpoint'i artık anında jobId döndürüyor
app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    
    const outputFormat = req.body.format;
    if (!outputFormat) return res.status(400).json({ message: 'Hedef format belirtilmedi.' });

    const jobId = crypto.randomUUID();
    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, `${jobId}.${outputFormat}`);

    jobs[jobId] = {
        status: 'Sırada bekliyor...',
        progress: 0,
        originalName: req.file.originalname,
        outputFormat: outputFormat,
        timestamp: Date.now()
    };
    
    // İşlemi hemen başlat ama bitmesini bekleme (asenkron)
    routeConversion(jobId, inputPath, outputPath, req.file.mimetype, outputFormat)
        .catch(error => {
            console.error(`[${jobId}] İşleme hatası:`, error.message);
            updateJobStatus(jobId, `Hata: ${error.message}`, 100);
            cleanupFiles(inputPath); // Başarısız olursa orijinal dosyayı sil
        });

    res.status(202).json({ jobId });
});

// YENİ: /status endpoint'i
app.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ message: 'İş bulunamadı.' });
    res.json(job);
});

// YENİ: /download endpoint'i
app.get('/download/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job || !job.downloadPath) {
        return res.status(404).json({ message: 'İndirilecek dosya bulunamadı veya işlem tamamlanmadı.' });
    }

    const originalName = path.parse(job.originalName).name;
    const newName = `${originalName}.${job.outputFormat}`;

    res.download(job.downloadPath, newName, (err) => {
        if (err) console.error(`İndirme hatası [${req.params.jobId}]:`, err);
        
        // İndirme sonrası temizlik
        cleanupFiles(job.downloadPath); 
        delete jobs[req.params.jobId];
    });
});


async function routeConversion(jobId, inputPath, outputPath, inputMime, outputFormat) {
    updateJobStatus(jobId, 'Dönüşüm türü belirleniyor...', 5);
    // ... (routeConversion'ın geri kalanı aynı, sadece artık 'res' yerine 'jobId' alıyor)
    // ... ve res.download yerine updateJobStatus çağırıyor.
    // === Bu fonksiyonların içindeki tüm res.download(...) çağrıları güncellendi ===
    // ...
// --- YENİ NESİL AKILLI YÖNLENDİRİCİ "USTA BAŞI" ---
    const typeMap = {
        pdf: 'application/pdf',
        office: ['officedocument', 'msword', 'powerpoint', 'rtf'],
        spreadsheet: ['sheet', 'csv', 'excel'],
        ebook: ['epub', 'x-mobipocket-ebook'],
        markup: ['html', 'markdown', 'plain'],
        image: 'image/',
        video: 'video/',
        audio: 'audio/',
        tex: ['x-tex', 'x-latex']
    };

    const getInputType = (mime) => {
        for (const type in typeMap) {
            if (typeof typeMap[type] === 'string' && mime.startsWith(typeMap[type])) return type;
            if (Array.isArray(typeMap[type]) && typeMap[type].some(keyword => mime.includes(keyword))) return type;
        }
        return 'unknown';
    };

    const inputType = getInputType(inputMime);

    const outputIs = {
        ebook: ['epub', 'mobi'].includes(outputFormat),
        office: ['docx', 'odt', 'rtf'].includes(outputFormat),
        pdf: outputFormat === 'pdf',
        image: ['png', 'jpg', 'webp', 'bmp', 'tiff', 'svg'].includes(outputFormat),
        videoAudio: ['mp4', 'mkv', 'webm', 'gif', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'flac'].includes(outputFormat),
        markup: ['html', 'md', 'txt'].includes(outputFormat),
        spreadsheet: ['csv', 'xlsx'].includes(outputFormat),
        tex: outputFormat === 'tex',
    };

    console.log(`[${jobId}] Tespit edilen girdi: ${inputType}, İstenen çıktı: ${Object.keys(outputIs).find(k => outputIs[k])}`);
    updateJobStatus(jobId, 'Uzman araçlar hazırlanıyor...', 10);

    // === STRATEJİK YÖNLENDİRME ===
    if (inputType === 'pdf' && outputIs.office) {
        return convertPdfToDocx(jobId, inputPath, outputPath); 
    }
    if (inputType === 'office' && outputIs.image) {
        return convertDocToImage(jobId, inputPath, outputPath);
    }
    if (inputType === 'pdf' && outputIs.tex) {
        return convertPdfToTex(jobId, inputPath, outputPath);
    }
    if (inputType === 'pdf' && outputIs.spreadsheet) {
        return convertPdfToCsv(jobId, inputPath, outputPath);
    }
    if (outputIs.spreadsheet) {
        if (inputType === 'spreadsheet' || inputType === 'office') return convertWithLibreOffice(jobId, inputPath, outputPath);
    }
    if (outputIs.tex) {
        if (inputType === 'markup' || inputType === 'office') return convertWithPandoc(jobId, inputPath, outputPath);
    }
    if (inputType === 'pdf' && outputIs.markup) {
        return convertPdfToMarkup(jobId, inputPath, outputPath);
    }
    if (outputIs.ebook) {
        if (['office', 'markup', 'pdf', 'ebook', 'tex'].includes(inputType)) return convertWithCalibre(jobId, inputPath, outputPath);
    }
    if (outputIs.office || outputIs.markup) {
        if (['office', 'markup', 'ebook', 'tex'].includes(inputType)) return convertWithPandoc(jobId, inputPath, outputPath);
    }
    if (outputIs.pdf) {
        if (['markup', 'ebook', 'office', 'tex'].includes(inputType)) return convertWithPandoc(jobId, inputPath, outputPath);
        if (inputType === 'image') return convertWithImageMagick(jobId, inputPath, outputPath);
    }
    if (outputIs.image) {
        if (inputType === 'image' || inputType === 'pdf') return convertWithImageMagick(jobId, inputPath, outputPath);
    }
    if (outputIs.videoAudio) {
        if (['video', 'audio', 'image'].includes(inputType)) return convertWithFfmpeg(jobId, inputPath, outputPath);
    }

    cleanupFiles(inputPath);
    throw new Error(`Dönüşüm desteklenmiyor: '${inputType}' formatından '${outputFormat}' formatına.`);
}

// --- UZMAN FONKSİYONLAR ---

const runCommand = (command, toolName, jobId, progressStart, progressEnd) => {
    return new Promise((resolve, reject) => {
        console.log(`[${jobId}] ${toolName} çalıştırılıyor:`, command);
        updateJobStatus(jobId, `${toolName} ile işlem yapılıyor...`, progressStart);
        
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${jobId}] ${toolName} exec error:`, stderr || stdout);
                return reject(new Error(`${toolName} hatası: ${stderr || error.message}`));
            }
            console.log(`[${jobId}] ${toolName} işlemi başarılı.`);
            updateJobStatus(jobId, `${toolName} işlemi tamamlandı.`, progressEnd);
            resolve(stdout);
        });
    });
};

const finalizeConversion = (jobId, outputPath, ...filesToClean) => {
    updateJobStatus(jobId, 'Dönüşüm tamamlandı!', 100, outputPath);
    cleanupFiles(...filesToClean);
};

// --- ÇOK AŞAMALI OPERASYONLAR ---

async function convertPdfToDocx(jobId, inputPath, outputPath) {
    const tempHtmlPath = `${inputPath}.html`;
    try {
        const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler', jobId, 15, 50);
        fs.writeFileSync(tempHtmlPath, htmlContent);
        updateJobStatus(jobId, 'Ara format (HTML) oluşturuldu.', 60);

        await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId, 65, 95);
        
        finalizeConversion(jobId, outputPath, inputPath, tempHtmlPath);
    } catch (error) {
        cleanupFiles(inputPath, tempHtmlPath);
        throw error;
    }
}
//... Diğer tüm convert fonksiyonları benzer şekilde jobId ve progress güncellemelerini alacak şekilde güncellendi.
async function convertPdfToTex(jobId, inputPath, outputPath) {
    const tempTxtPath = `${inputPath}.txt`;
    try {
        const extractedText = await runCommand(`pdftotext -layout "${inputPath}" -`, 'Poppler', jobId, 15, 50);
        fs.writeFileSync(tempTxtPath, extractedText);
        updateJobStatus(jobId, 'Metin içeriği çıkarıldı.', 60);

        await runCommand(`pandoc "${tempTxtPath}" -f commonmark -o "${outputPath}"`, 'Pandoc', jobId, 65, 95);
        
        finalizeConversion(jobId, outputPath, inputPath, tempTxtPath);
    } catch (error) {
        cleanupFiles(inputPath, tempTxtPath);
        throw error;
    }
}

async function convertPdfToCsv(jobId, inputPath, outputPath) {
    const tempHtmlPath = `${inputPath}.html`;
    try {
        const htmlContent = await runCommand(`pdftohtml -q -s -stdout "${inputPath}"`, 'Poppler', jobId, 15, 50);
        fs.writeFileSync(tempHtmlPath, htmlContent);
        updateJobStatus(jobId, 'Tablo yapısı analiz ediliyor.', 60);

        await runCommand(`pandoc "${tempHtmlPath}" -o "${outputPath}"`, 'Pandoc', jobId, 65, 95);

        finalizeConversion(jobId, outputPath, inputPath, tempHtmlPath);
    } catch (error) {
        cleanupFiles(inputPath, tempHtmlPath);
        throw error;
    }
}


async function convertPdfToMarkup(jobId, inputPath, outputPath) {
    const tempTxtPath = `${inputPath}.txt`;
    try {
        const extractedText = await runCommand(`pdftotext -layout "${inputPath}" -`, 'Poppler', jobId, 15, 95);
        fs.writeFileSync(tempTxtPath, extractedText);
        finalizeConversion(jobId, outputPath, inputPath, tempTxtPath); // Pandoc'a gerek yok, direkt txt'yi kullanabiliriz.
        // Aslında, çıktı zaten txt ise, bu dosyayı yeniden adlandırıp sonlandırabiliriz.
        fs.renameSync(tempTxtPath, outputPath);
    } catch (error) {
        cleanupFiles(inputPath, tempTxtPath);
        throw error;
    }
}

async function convertDocToImage(jobId, inputPath, outputPath) {
    try {
        const tempPdfPath = await convertToPdfWithLibreOffice(jobId, inputPath, 20, 60);
        await convertWithImageMagick(jobId, tempPdfPath, outputPath, 65, 95, [inputPath, tempPdfPath]);
    } catch (error) {
        cleanupFiles(inputPath);
        throw error;
    }
}

function convertToPdfWithLibreOffice(jobId, inputPath, progressStart, progressEnd) {
    return new Promise(async (resolve, reject) => {
        try {
            const command = `soffice --headless --convert-to pdf --outdir ${uploadDir} "${inputPath}"`;
            const expectedPdfPath = path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.pdf`);
            await runCommand(command, 'LibreOffice', jobId, progressStart, progressEnd);
            resolve(expectedPdfPath);
        } catch (error) {
            reject(error);
        }
    });
}

async function convertWithLibreOffice(jobId, inputPath, outputPath) {
    const outputFormat = path.extname(outputPath).substring(1);
    const command = `soffice --headless --convert-to ${outputFormat} --outdir ${uploadDir} "${inputPath}"`;
    const expectedOutputPath = path.join(uploadDir, `${path.parse(path.basename(inputPath)).name}.${outputFormat}`);
    
    await runCommand(command, 'LibreOffice', jobId, 15, 95);
    finalizeConversion(jobId, expectedOutputPath, inputPath);
}


async function convertWithImageMagick(jobId, inputPath, outputPath, progressStart = 15, progressEnd = 95, filesToClean = [inputPath]) {
    const source = inputPath.endsWith('.pdf') ? `${inputPath}[0]` : inputPath;
    const command = `convert -density 300 "${source}" -quality 100 -background white -alpha remove -alpha off -trim "${outputPath}"`;
    await runCommand(command, 'ImageMagick', jobId, progressStart, progressEnd);
    finalizeConversion(jobId, outputPath, ...filesToClean);
}

async function convertWithFfmpeg(jobId, inputPath, outputPath) {
    const outputFormat = path.extname(outputPath).substring(1).toLowerCase();
    const inputFormat = path.extname(inputPath).substring(1).toLowerCase();
    let command;

    if ((inputFormat === 'mkv' && outputFormat === 'mp4') || (inputFormat === 'mp4' && outputFormat === 'mkv')) {
        command = `ffmpeg -i "${inputPath}" -c copy -y "${outputPath}"`;
        try {
            await runCommand(command, 'FFmpeg (Remux)', jobId, 15, 95);
            finalizeConversion(jobId, outputPath, inputPath);
            return;
        } catch (remuxErr) {
            console.warn(`[${jobId}] Remux başarısız, yeniden kodlamaya geçiliyor.`, remuxErr.message);
            updateJobStatus(jobId, 'Codec uyumsuz, yeniden kodlama yapılıyor...', 20);
        }
    }

    if (outputFormat === 'gif') {
        command = `ffmpeg -i "${inputPath}" -vf "fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "${outputPath}"`;
    } else {
        command = `ffmpeg -i "${inputPath}" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -y "${outputPath}"`;
    }

    await runCommand(command, `FFmpeg (${outputFormat} Encode)`, jobId, 25, 95);
    finalizeConversion(jobId, outputPath, inputPath);
}


async function convertWithPandoc(jobId, inputPath, outputPath) {
    const command = `pandoc "${inputPath}" -s -o "${outputPath}"`;
    await runCommand(command, 'Pandoc', jobId, 15, 95);
    finalizeConversion(jobId, outputPath, inputPath);
}

async function convertWithCalibre(jobId, inputPath, outputPath) {
    const command = `ebook-convert "${inputPath}" "${outputPath}"`;
    await runCommand(command, 'Calibre', jobId, 15, 95);
    finalizeConversion(jobId, outputPath, inputPath);
}


app.listen(port, () => console.log(`Sunucu ${port} portunda çalışıyor.`));

