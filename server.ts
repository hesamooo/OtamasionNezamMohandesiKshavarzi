import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for parsing JSON with generous limit for document/scan images
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Helper to get GoogleGenAI client with effective API key (user-supplied header/body or server env)
function getEffectiveKey(req?: Request): string {
  const headerKey = (req?.headers['x-gemini-api-key'] as string || '').trim();
  const bodyKey = (req?.body?.apiKey as string || '').trim();
  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  return headerKey || bodyKey || envKey;
}

function getAIClient(effectiveKey: string) {
  if (!effectiveKey || effectiveKey.length < 5) return null;
  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for Persian agricultural engineering expert
const AGRICULTURAL_ENGINEERING_SYSTEM_INSTRUCTION = `شما مشاور و کارشناس هوشمند رسمی نظام مهندسی کشاورزی و منابع طبیعی استان فارس، مرکز خدمات تخصصی ۶۳۶ شهرستان خفر هستید.
وظیفه شما:
۱. پاسخ دقیق، فنی، مستند و به‌روز به سوالات متقاضیان و کارشناسان در زمینه صدور پروانه‌های کشاورزی و بهره‌برداری.
۲. ارائه دقیق ضوابط و فواصل قانونی، حرایم بهداشتی و زیست‌محیطی بر اساس آخرین مصوبات وزارت جهاد کشاورزی و سازمان نظام مهندسی کشاورزی ایران:
   - گروه ۱: احداث گلخانه سبزی و صیفی (حداقل ۳۰۰۰ مترمربع عرصه، حداقل ۱۰۰۰ مترمربع سازه مفید، سهمیه ۵۰۰۰ لیتر آب در شبانه‌روز در هکتار)، پرورش قارچ دکمه‌ای و صدفی (حداقل ۵۰ تن در سال، ۵۰۰ لیتر آب در شبانه‌روز).
   - گروه ۲: دامپروری، طیور و شیلات (گوسفند داشتی حداقل ۵۰ رأس در ۱۰۰۰ متر عرصه، گوسفند پرواری حداقل ۱۰۰ رأس در ۱۲۰۰ متر، گاو شیری حداقل ۲۰ رأس در ۱۵۰۰ متر، مرغداری گوشتی حداقل ۲۰,۰۰۰ قطعه، رعایت حرایم بهداشتی ۵۰۰ تا ۲۰۰۰ متر از کانون‌های جمعیتی و واحدهای متداخل، شیلات سردابی و گرمابی).
   - گروه ۳: تأسیس داروخانه گیاهپزشکی، کلینیک و شرکت‌های فنی مهندسی (رتبه معتبر، فرم ۱۸ بندی بازرسی فنی، انبار ایمن سموم، استانداردهای تهویه).
۳. راهنمایی دقیق در خصوص نقشه‌برداری، مختصات UTM زون 39R بیضوی WGS84، حریم راه‌ها و حریم چاه‌های آب کشاورزی در شهرستان خفر استان فارس.
۴. وقتی نیاز به آخرین بخشنامه‌ها و اطلاعات روز است، از ابزار جستجوی گوگل استفاده نمایید و منابع مستند را اعلام کنید.
زبان پاسخگویی: فارسی رسمی، محترمانه، دقیق، شفاف و همراه با تفکیک موارد به صورت تیتروار و خوانا.`;

async function runGeminiGenerateWithFallback(
  aiInstance: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    timeoutMs?: number;
  }
) {
  const modelChain = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;
  const timeoutMs = options.timeoutMs || 7000;

  for (const model of modelChain) {
    try {
      const callPromise = aiInstance.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs)
      );
      const resp = (await Promise.race([callPromise, timeoutPromise])) as any;
      return { resp, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      console.warn(`Model ${model} issue (${errMsg.slice(0, 80)}), trying next fallback...`);
      continue;
    }
  }
  throw lastError;
}

function extractResponseText(resp: any): string {
  if (resp?.text) return resp.text;
  const cand = resp?.candidates?.[0];
  const partText = cand?.content?.parts?.[0]?.text;
  return partText || '';
}

// 1. Status endpoint
app.get('/api/ai/status', (req: Request, res: Response) => {
  const currentKey = getEffectiveKey(req);
  res.json({
    online: true,
    model: 'gemini-3.8-flash',
    searchGrounding: true,
    hasApiKey: Boolean(currentKey && currentKey.length > 5),
    hasServerKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    server: 'Nezam 636 Khafr AI Engine',
  });
});

// 1.1 Test key endpoint to verify Gemini connectivity
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  try {
    const key = getEffectiveKey(req);
    if (!key) {
      res.status(400).json({ success: false, error: 'هیچ کلید API ارسال نشده است.' });
      return;
    }
    const aiInstance = getAIClient(key);
    if (!aiInstance) {
      res.status(400).json({ success: false, error: 'فرمت کلید نامعتبر است.' });
      return;
    }
    const { resp, modelUsed } = await runGeminiGenerateWithFallback(aiInstance, {
      contents: 'سلام',
      config: { maxOutputTokens: 10 }
    });
    const echoText = extractResponseText(resp) || 'OK';
    res.json({
      success: true,
      message: 'اتصال به Gemini API با موفقیت تأیید گردید.',
      model: modelUsed,
      echo: echoText
    });
  } catch (err: any) {
    console.error('Error in /api/ai/test-key:', err);
    res.status(400).json({
      success: false,
      error: err?.message || 'خطا در اعتبارسنجی کلید با سرورهای گوگل'
    });
  }
});

// 2. Chat endpoint with Google Search Grounding
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'پیام نامعتبر است.' });
      return;
    }

    const effectiveKey = getEffectiveKey(req);
    if (!effectiveKey) {
      res.status(503).json({
        error: 'کلید API تنظیم نشده است. لطفاً در بخش تنظیمات هوش مصنوعی، کلید اختصاصی Gemini API خود را وارد نمایید.',
      });
      return;
    }

    const aiInstance = getAIClient(effectiveKey);
    if (!aiInstance) {
      res.status(400).json({ error: 'فرمت کلید API نامعتبر است.' });
      return;
    }

    // Build contents for chat
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role === 'user' || item.role === 'model') {
          formattedContents.push({
            role: item.role,
            parts: [{ text: String(item.text || item.message || '') }],
          });
        }
      }
    }

    // Add current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let replyText = '';
    let groundingChunks: any[] = [];
    let webSearchQueries: any[] = [];

    const enableSearch = Boolean(req.body.useSearch);
    if (enableSearch) {
      try {
        const { resp: response } = await runGeminiGenerateWithFallback(aiInstance, {
          contents: formattedContents,
          config: {
            systemInstruction: AGRICULTURAL_ENGINEERING_SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 0 },
          },
          timeoutMs: 5000,
        });

        replyText = extractResponseText(response);
        groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
      } catch (searchErr) {
        console.warn('Search grounding failed or quota exhausted, falling back to direct AI generation...');
      }
    }

    if (!replyText) {
      const { resp: response } = await runGeminiGenerateWithFallback(aiInstance, {
        contents: formattedContents,
        config: {
          systemInstruction: AGRICULTURAL_ENGINEERING_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 0 },
        },
        timeoutMs: 12000,
      });
      replyText = extractResponseText(response);
    }

    res.json({
      success: true,
      text: replyText,
      groundingChunks: groundingChunks,
      webSearchQueries: webSearchQueries,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    const errStr = String(error?.message || '');
    const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');

    // پایگاه دانش قوانین محلی به عنوان پشتیبان در زمان بروز محدودیت موقت سهمیه
    const qLower = String(req.body.message || '').toLowerCase();
    const localAnswers = [
      {
        kw: ['گلخانه', 'سبزی', 'صیفی', 'سازه'],
        ans: 'احداث گلخانه سبزی و صیفی در شهرستان خفر:\n• حداقل زمین مورد نیاز: ۳۰۰۰ متر مربع (سازه مفید حداقل ۱۰۰۰ متر مربع)\n• استعلام‌های الزامی: امور آب (تأمین ۵۰۰۰ لیتر آب در شبانه‌روز در هکتار)، شرکت گاز یا نفت، جهاد کشاورزی و محیط زیست.',
      },
      {
        kw: ['قارچ', 'کمپوست'],
        ans: 'پرورش قارچ خوراکی دکمه‌ای:\n• حداقل ظرفیت مجاز صدور پروانه: ۵۰ تن در سال\n• نیاز آبی: ۵۰۰ لیتر در شبانه‌روز\n• مدارک مورد نیاز: سند مالکیت یا اجاره‌نامه رسمی، کروکی UTM عرصه، آزمایش آب و تأییدیه نظام مهندسی.',
      },
      {
        kw: ['گوسفند', 'بره', 'پرواری', 'داشتی'],
        ans: 'دامپروری گوسفند و بره در خفر:\n• حداقل ظرفیت پرواربندی: ۱۰۰ رأس | حداقل مساحت زمین: ۱۲۰۰ متر مربع\n• گوسفند داشتی: حداقل ۵۰ رأس | زمین مورد نیاز: ۱۰۰۰ متر مربع\n• فواصل قانونی: رعایت حداقل حریم ۵۰۰ متری از مرز روستا و مراکز مسکونی طبق دستورالعمل نظام دامپروری.',
      },
      {
        kw: ['مرغ', 'طیور', 'گوشتی'],
        ans: 'مرغداری گوشتی در خفر:\n• حداقل ظرفیت: ۲۰,۰۰۰ قطعه در هر دوره پرورش\n• حداقل زمین: ۵۰۰۰ متر مربع\n• حریم بهداشتی: حداقل ۱۰۰۰ متر از مرغداری‌های هم‌نوع و ۲۰۰۰ متر از کانون‌های جمعیتی و مزارع مرغ مادر.',
      },
      {
        kw: ['داروخانه', 'گیاهپزشکی', 'سموم', 'کلینیک'],
        ans: 'تأسیس داروخانه و کلینیک گیاهپزشکی در خفر:\n• شرایط متقاضی: کارشناس یا کارشناس ارشد گیاهپزشکی عضو سازمان نظام مهندسی با رتبه معتبر\n• چک‌لیست: فرم ۱۸ بندی بازرسی، سند یا اجاره‌نامه با کاربری تجاری/خدماتی، تهویه استاندارد، کپسول آتش‌نشانی و انبار ایمن سموم.',
      },
      {
        kw: ['کروکی', 'utm', 'نقشه', 'زون'],
        ans: 'ضوابط کروکی UTM مرکز ۶۳۶ خفر:\n• زون غالب شهرستان خفر: Zone 39R در نیمکره شمالی (WGS84)\n• حداقل نقاط برای چندضلعی زمین: ۳ نقطه با خطای زیر ۵ سانتی‌متر\n• شیت چاپی کروکی به صورت خودکار در ۲ برگ تفکیک می‌شود (برگه اول نقشه بزرگ و برگه دوم جداول مساحت و مختصات).',
      },
    ];

    let fallbackText = '';
    for (const item of localAnswers) {
      if (item.kw.some((k) => qLower.includes(k))) {
        fallbackText = item.ans;
        break;
      }
    }
    if (!fallbackText) {
      fallbackText = 'در مرکز خدمات کشاورزی ۶۳۶ خفر، پرونده‌ها در ۳ گروه تخصصی رسیدگی می‌شوند: ۱. گلخانه و قارچ ۲. دام و طیور و شیلات ۳. کلینیک و داروخانه گیاهپزشکی طبق دستورالعمل‌های نظام مهندسی کشاورزی فارس.';
    }

    if (isQuota) {
      res.json({
        success: true,
        text: `📌 *[پاسخ بر اساس پایگاه دانش مصوب مرکز ۶۳۶ خفر]*:\n${fallbackText}\n\n💡 *نکته سرور:* در صورت تمایل به افزایش سهمیه کوئری همزمان، می‌توانید کلید اختصاصی پروژه را در بخش Settings > Secrets فعال فرمایید.`,
        groundingChunks: [],
        webSearchQueries: [],
      });
      return;
    }

    res.status(500).json({
      error: error?.message || 'خطا در ارتباط با مدل جمینای',
    });
  }
});

// 3. Document / OCR extraction endpoint
app.post('/api/ai/ocr-extract', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, rawText } = req.body;

    if (!imageBase64 && !rawText) {
      res.status(400).json({ error: 'هیچ تصویری یا متنی ارسال نشده است.' });
      return;
    }

    const effectiveKey = getEffectiveKey(req);
    if (!effectiveKey) {
      res.status(503).json({
        error: 'کلید API تنظیم نشده است. لطفاً در بخش هوش مصنوعی کلید Gemini خود را وارد کنید.',
      });
      return;
    }

    const aiInstance = getAIClient(effectiveKey);
    if (!aiInstance) {
      res.status(400).json({ error: 'فرمت کلید API نامعتبر است.' });
      return;
    }

    const promptText = `شما یک ابزار تخصصی استخراج اطلاعات اسناد ملکی، قولنامه‌ها، پروانه‌های کشاورزی و نقشه‌های UTM در شهرستان خفر استان فارس هستید.
وظیفه شما: متن کامل یا تصویر پیوست‌شده را به دقت بررسی کنید و اطلاعات پرونده را به صورت JSON معتبر و ساختاریافته استخراج کنید:
- applicantName: نام و نام خانوادگی متقاضی (مثال: علی احمدی)
- nationalId: کدملی ۱۰ یا ۱۱ رقمی (فقط ارقام انگلیسی)
- phoneNumber: شماره موبایل (مثال: 09171234567)
- planTitle: موضوع یا عنوان طرح (مثال: احداث گلخانه سبزی و صیفی، پرورش گوسفند پرواری، داروخانه گیاهپزشکی)
- mainGroup: یکی از مقادیر دقیق: "GREENHOUSE_MUSHROOM" یا "LIVESTOCK_POULTRY_FISHERIES" یا "CLINIC_PHARMACY"
- actType: نوع فعالیت متناسب (greenhouse_veg, greenhouse_flower, mushroom_button, sheep_high, cattle_dairy, broiler, clinic_center, pharmacy_center)
- landArea: مساحت عرصه/زمین به مترمربع (فقط عدد)
- capacity: ظرفیت یا تعداد (عدد)
- location: موقعیت اراضی یا پلاک ثبتی یا نام روستا (مثال: فارس، شهرستان خفر، اراضی باب‌انار، پلاک ثبتی ۱۲۳)
- utmCoordinates: تمام نقاط گوشه زمین یا نقاط عوارض به صورت خط به خط با فرمت:
  X1,Y1
  X2,Y2
  (مختصات X عدد شش رقمی حدود 700000 و مختصات Y عدد هفت رقمی حدود 3200000 در زون 39R خفر)
- fullSummary: خلاصه توضیحات استخراج‌شده و نکات حقوقی سند به زبان فارسی.`;

    const parts: Array<any> = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    if (rawText) {
      parts.push({
        text: `متن تکمیلی/خام سند:\n${rawText}`,
      });
    }

    parts.push({
      text: promptText,
    });

    const { resp: response } = await runGeminiGenerateWithFallback(aiInstance, {
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            applicantName: { type: Type.STRING },
            nationalId: { type: Type.STRING },
            phoneNumber: { type: Type.STRING },
            planTitle: { type: Type.STRING },
            mainGroup: { type: Type.STRING },
            actType: { type: Type.STRING },
            landArea: { type: Type.STRING },
            capacity: { type: Type.STRING },
            location: { type: Type.STRING },
            utmCoordinates: { type: Type.STRING },
            fullSummary: { type: Type.STRING },
          },
          required: ['applicantName', 'utmCoordinates'],
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
      timeoutMs: 15000,
    });

    const rawJson = extractResponseText(response) || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(rawJson);
    } catch {
      parsedData = { fullSummary: rawJson };
    }

    res.json({
      success: true,
      data: parsedData,
      rawText: rawJson,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ocr-extract:', error);
    // استخراج محلی به کمک عبارات باقاعده در صورت بروز خطا در مدل ابری
    const textToParse = String(req.body.rawText || '');
    const clean = textToParse.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

    const nidMatch = clean.match(/(?:کد\s*ملی|ملی|شناسه)[:\s]*(\d{10,11})/) || clean.match(/\b(\d{10})\b/);
    const phoneMatch = clean.match(/(09\d{9})/);
    const nameMatch = textToParse.match(/(?:متقاضی|نام\s*و\s*نام\s*خانوادگی|نام|آقای|خانم|شرکت)[:\s]*([^\n،,\d]{3,35})/);
    const landMatch = clean.match(/(?:مساحت|عرصه|متراژ|زمین)[:\s]*([0-9.,]+)/);

    const utmLines: string[] = [];
    const coordRegex = /(?:[Xхx]\s*[:=]?\s*)?([1-9]\d{5})(?:[\s,،\t]+)(?:[Yуy]\s*[:=]?\s*)?([2-4]\d{6})/gi;
    let m;
    while ((m = coordRegex.exec(clean)) !== null) {
      utmLines.push(`${m[1]},${m[2]}`);
    }

    const fallbackData = {
      applicantName: nameMatch ? nameMatch[1].trim() : '',
      nationalId: nidMatch ? nidMatch[1] : '',
      phoneNumber: phoneMatch ? phoneMatch[1] : '',
      planTitle: textToParse.includes('گلخانه') ? 'احداث گلخانه سبزی و صیفی' : textToParse.includes('دام') ? 'دامپروری' : 'طرح کشاورزی',
      mainGroup: textToParse.includes('دام') || textToParse.includes('گوسفند') ? 'LIVESTOCK_POULTRY_FISHERIES' : textToParse.includes('داروخانه') ? 'CLINIC_PHARMACY' : 'GREENHOUSE_MUSHROOM',
      actType: 'greenhouse_veg',
      landArea: landMatch ? landMatch[1].replace(/,/g, '') : '1000',
      location: 'فارس، شهرستان خفر، مرکزی',
      utmCoordinates: utmLines.join('\n'),
      fullSummary: 'استخراج شده توسط موتور هوشمند پشتیبان مرکز ۶۳۶ خفر.',
    };

    res.json({
      success: true,
      data: fallbackData,
      rawText: JSON.stringify(fallbackData, null, 2),
      offlineFallback: true,
    });
  }
});

// Start server and mount Vite
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Agricultural Automation Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
