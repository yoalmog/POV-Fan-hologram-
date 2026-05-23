import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { POVSimulator } from "./components/POVSimulator";
import { generateDefaultLogo, convertImageToPolar, RGBColor } from "./lib/polarConverter";
import { generateHologramLogo } from "./lib/gemini";
import { POVConfig, SUPPORTED_EFFECTS } from "./types";
import {
  Upload,
  Cpu,
  Play,
  Languages,
  Image as ImageIcon,
  Settings,
  UploadCloud,
  Wifi,
  Database,
  RefreshCw,
  Smartphone,
  Eye,
  Crosshair,
  Zap,
  ChevronDown,
  Info,
  Save,
  HardDrive,
  LayoutGrid,
  Lock
} from "lucide-react";

export default function App() {
  const [lang, setLang] = useState<"he" | "en">("he");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [wifiStatus, setWifiStatus] = useState<"disconnected" | "connecting" | "connected">("connected");
  const [isUpdatingWifi, setIsUpdatingWifi] = useState(false);
  const [showWifiTrouble, setShowWifiTrouble] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      addTerminalLog("SYSTEM", "PWA Install Prompt detected and captured.");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      addTerminalLog("SYSTEM", "Install prompt not available (already installed or platform restriction)");
      alert(lang === "he" 
        ? "האפליקציה כבר מותקנת או שאינה נתמכת בדפדפן זה. נסה להשתמש בדפדפן כרום." 
        : "App is already installed or not supported. Try using Chrome.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      addTerminalLog("SYSTEM", "PWA Installation accepted by user.");
    }
  };

  const addTerminalLog = (type: string, msg: string) => {
    setTerminalLogs(prev => [{ time: new Date().toLocaleTimeString(), type, msg }, ...prev].slice(0, 50));
  };

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = (msg: string) => {
    setSaveStatus(msg);
    addTerminalLog("SYSTEM", `Settings Saved: ${msg}`);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSync = () => {
    addTerminalLog("HOST OUT", `Syncing config to ESP32: Mode=${config.activeEffect}, Bright=${config.brightness}`);
    addTerminalLog("DEVICE IN", "OK: Configuration received and stored in EEPROM.");
    handleSave(lang === "he" ? "הגדרות סונכרנו בהצלחה" : "Config Synced Successfully");
  };

  const handleUpdateWifi = async () => {
    if (!config.wifiSSID) {
      alert(lang === "he" ? "נא להזין שם רשת (SSID)" : "Please enter a Network Name (SSID)");
      return;
    }
    setIsUpdatingWifi(true);
    setWifiStatus("connecting");
    addTerminalLog("SYSTEM", `Connecting to Wi-Fi: ${config.wifiSSID}...`);
    
    // Simulate connection delay
    await new Promise(r => setTimeout(r, 2000));
    
    setWifiStatus("connected");
    setIsUpdatingWifi(false);
    addTerminalLog("DEVICE IN", `WiFi Connected. IP: 192.168.1.${Math.floor(Math.random() * 254) + 1}`);
    handleSave(lang === "he" ? "הגדרות רשת עודכנו" : "Wi-Fi Config Updated");
  };

  const [showPhysicalRotor, setShowPhysicalRotor] = useState<boolean>(true);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [simSpeed, setSimSpeed] = useState<number>(3);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<{ time: string, type: string, msg: string }[]>([
    { time: "12:20:50 AM", type: "HOST OUT", msg: "Set Effect for Arm A -> [0] לוגו מותאם אישית (העלאה)" },
    { time: "12:20:50 AM", type: "HOST OUT", msg: "65 41 02" },
    { time: "12:20:50 AM", type: "HOST OUT", msg: "Set Effect for Arm A -> [2] מערבולת קשת (Rainbow Wheel)" }
  ]);

  const [config, setConfig] = useState<POVConfig>({
    numLeds: 45,
    numArms: 2,
    numSectors: 120,
    rpm: 1200,
    wiringType: "continuous",
    colorFormat: "RGB332",
    activeEffect: 0,
    activeEffectArmB: 0,
    brightness: 180,
    scrollText: "WS2812B POV",
    scrollTextArmB: "SPIN POV",
    separateArmControl: false,
    effectSpeed: 100,
    effectIntensity: 100,
    effectDensity: 100,
    stripsPerArm: 1,
    pinArmA: 18,
    pinArmB: 19,
    pinHall: 27,
    pinSD_CS: 5,
    pinSD_MOSI: 23,
    pinSD_MISO: 19,
    pinSD_SCK: 18,
    wifiSSID: "ESP32-POV-HOLOGRAPH",
    wifiPassword: "HologramEngine101",
    hallOffset: 360,
    isSequenceActive: false,
    sequenceSteps: []
  });

  const [imgBrightness, setImgBrightness] = useState<number>(71);
  const [imgContrast, setImgContrast] = useState<number>(15);
  const [imgInvert, setImgInvert] = useState<boolean>(false);
  const [imgSaturation, setImgSaturation] = useState<number>(0);
  const [imgGrayscale, setImgGrayscale] = useState<boolean>(false);
  const [imgThresholdMode, setImgThresholdMode] = useState<boolean>(false);
  const [imgThreshold, setImgThreshold] = useState<number>(128);
  const [imgAlphaThreshold, setImgAlphaThreshold] = useState<number>(20);

  const [polarData, setPolarData] = useState<RGBColor[][]>([]);

  useEffect(() => {
    setPolarData(generateDefaultLogo(config.numLeds, config.numSectors));
  }, [config.numLeds, config.numSectors]);

  const handleConfigChange = (updated: Partial<POVConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) handleFileSelection(file);
  };

  const handleFileSelection = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processImageAndConvert(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageAndConvert = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const resolution = 400;
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, resolution, resolution);
          ctx.save();
          ctx.beginPath();
          ctx.arc(resolution/2, resolution/2, resolution/2, 0, 2 * Math.PI);
          ctx.clip();
          const rAspect = img.width / img.height;
          let drawW = resolution;
          let drawH = resolution;
          let dx = 0;
          let dy = 0;
          if (rAspect > 1) {
            drawH = resolution / rAspect;
            dy = (resolution - drawH) / 2;
          } else {
            drawW = resolution * rAspect;
            dx = (resolution - drawW) / 2;
          }
          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.restore();
          const polar = await convertImageToPolar(canvas, config.numLeds, config.numSectors, {
            brightness: imgBrightness,
            contrast: imgContrast,
            threshold: imgThreshold,
            invert: imgInvert,
            saturation: imgSaturation,
            grayscale: imgGrayscale,
            thresholdMode: imgThresholdMode,
            alphaThreshold: imgAlphaThreshold
          });
          setPolarData(polar);
          handleConfigChange({ activeEffect: 0 });
        }
      };
      if (typeof event.target?.result === "string") img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiLogo = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const generatedBase64 = await generateHologramLogo(aiPrompt);
      if (generatedBase64) {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const resolution = 400;
          canvas.width = resolution;
          canvas.height = resolution;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, resolution, resolution);
            ctx.drawImage(img, 0, 0, resolution, resolution);
            const polar = await convertImageToPolar(canvas, config.numLeds, config.numSectors, {
              brightness: imgBrightness, contrast: imgContrast, threshold: imgThreshold, invert: imgInvert, saturation: imgSaturation, grayscale: imgGrayscale, thresholdMode: imgThresholdMode, alphaThreshold: imgAlphaThreshold
            });
            setPolarData(polar);
            handleConfigChange({ activeEffect: 0 });
          }
        };
        img.src = generatedBase64;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0c0c0c] text-[#e0e0e0] p-4 md:p-8 font-sans selection:bg-cyan-500/30 ${lang === "he" ? "rtl" : "ltr"}`} dir={lang === "he" ? "rtl" : "ltr"}>
      
      {/* Header Section */}
      <header className="max-w-xl mx-auto flex flex-col mb-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              HOLOSPIN<br />
              <span className="text-cyan-400">POV</span>
            </h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[2px] mt-2 border-t border-white/10 pt-2">
              {lang === "he" ? "זרועות מסתובבות 2 • WS2812B לדים חכמים" : "2 ROTATING ARMS • WS2812B SMART LEDS"}
            </p>
          </div>
          <div className="bg-cyan-950/30 border border-cyan-500/20 px-3 py-1.5 rounded text-[9px] font-bold text-cyan-400 tracking-wider">
            WS2812B PRO<br />BUILDER
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleInstallClick}
            className="flex-1 bg-cyan-500 text-black py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm"
          >
            <Smartphone className="w-4 h-4" />
            {lang === "he" ? "התקן למסך הבית" : "Install to Home"}
          </button>
          <button onClick={() => setLang(lang === "he" ? "en" : "he")} className="bg-[#1a1a1a] border border-white/5 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-white/5 font-bold">
            <Languages className="w-4 h-4 text-cyan-400" />
            {lang === "he" ? "English 🇺🇸" : "עברית 🇮🇱"}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 bg-[#111] border border-white/5 p-4 rounded-3xl">
          <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)] ${
            wifiStatus === "connected" ? "bg-cyan-400" : wifiStatus === "connecting" ? "bg-amber-400" : "bg-red-400"
          }`} />
          <span className="text-xs font-bold tracking-widest text-white/50 uppercase">
            {wifiStatus === "connected" 
              ? (lang === "he" ? "חיבור ESP32 פעיל" : "ESP32 CONNECTION ACTIVE")
              : wifiStatus === "connecting"
              ? (lang === "he" ? "מתחבר ל-Wi-Fi..." : "CONNECTING TO WI-FI...")
              : (lang === "he" ? "מנותק" : "DISCONNECTED")}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-10 pb-20">
        
        {/* Hardware Specs Card */}
        <motion.section 
          id="hw-specs"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "מפרט מכאני וחומרה" : "Hardware Specs"}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="holo-label">{lang === "he" ? "לדים לכל זרוע" : "LEDs per arm"}</label>
              <input type="number" value={config.numLeds} onChange={(e) => handleConfigChange({ numLeds: parseInt(e.target.value) })} className="holo-input w-full text-center font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <label className="holo-label">{lang === "he" ? "זרועות תצוגה" : "Display Arms"}</label>
              <input type="number" value={config.numArms} onChange={(e) => handleConfigChange({ numArms: parseInt(e.target.value) })} className="holo-input w-full text-center font-bold text-lg" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="holo-label">{lang === "he" ? "חיווט לדים בזרועות" : "Wiring Layout"}</label>
              <div className="relative group">
                <select value={config.wiringType} onChange={(e) => setConfig({...config, wiringType: e.target.value as any})} className="holo-input w-full appearance-none pr-10 font-bold">
                  <option value="continuous">{lang === "he" ? "רציף (0->44 ואז 44->0)" : "Daisy-chain (0->44 -> 44->0)"}</option>
                  <option value="separate">{lang === "he" ? "נפרד לכל זרוע" : "Split Stream"}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-cyan-400 font-mono text-[11px] font-bold">
                  <span className="bg-cyan-500/10 px-2 py-0.5 rounded">GPIO {config.pinArmA}</span>
                  <span className="text-white/20">→</span>
                  <span>ARM A [0-{config.numLeds - 1}]</span>
                </div>
                {config.wiringType === "separate" ? (
                  <div className="flex items-center gap-3 text-cyan-400 font-mono text-[11px] font-bold">
                    <span className="bg-cyan-500/10 px-2 py-0.5 rounded">GPIO {config.pinArmB}</span>
                    <span className="text-white/20">→</span>
                    <span>ARM B [0-{config.numLeds - 1}]</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-white/20 font-mono text-[11px] font-bold italic">
                    <span>(Daisy-chained from Arm A)</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/30 font-bold leading-relaxed border-t border-white/5 pt-3">
                {config.wiringType === "separate" 
                  ? (lang === "he" ? "מצב שידור מפוצל: כל זרוע מקבלת אות נפרד מה-ESP32." : "Split Stream: Each arm receives a separate data signal from ESP32.")
                  : (lang === "he" ? "מצב המוגדר כמשורשר: נדרש חיבור פיזי בין סוף זרוע א' לתחילת זרוע ב'." : "Continuous mode: Requires physical wire from end of Arm A to start of Arm B.")}
              </p>
            </div>
          </div>
        </motion.section>

        {/* WiFi Manager Section */}
        <motion.section 
          id="wifi-manager"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card border-indigo-500/20"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Wifi className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "מנהל רשת Wi-Fi" : "Wi-Fi Manager"}</h2>
            </div>
            <div className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border ${
              wifiStatus === "connected" 
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-500" 
                : wifiStatus === "connecting"
                ? "bg-amber-950/20 border-amber-500/20 text-amber-500"
                : "bg-red-950/20 border-red-500/20 text-red-500"
            }`}>
              {wifiStatus === "connected" ? (lang === "he" ? "מחובר" : "CONNECTED") : wifiStatus === "connecting" ? (lang === "he" ? "מתחבר" : "CONNECTING") : (lang === "he" ? "מנותק" : "OFFLINE")}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="holo-label">{lang === "he" ? "שם רשת (SSID)" : "Network Name (SSID)"}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={config.wifiSSID} 
                    onChange={(e) => handleConfigChange({ wifiSSID: e.target.value })}
                    className="holo-input w-full pl-10" 
                    placeholder="SSID"
                  />
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="holo-label">{lang === "he" ? "סיסמה" : "Password"}</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={config.wifiPassword} 
                    onChange={(e) => handleConfigChange({ wifiPassword: e.target.value })}
                    className="holo-input w-full pl-10" 
                    placeholder="********"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleUpdateWifi}
              disabled={isUpdatingWifi}
              className="w-full py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUpdatingWifi ? (
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-indigo-400" />
              )}
              {isUpdatingWifi 
                ? (lang === "he" ? "מעדכן..." : "UPDATING...") 
                : (lang === "he" ? "עדכן הגדרות רשת" : "Update Network Config")}
            </button>

            {/* Real-world Wi-Fi Troubleshooting helper */}
            <div className="pt-4 mt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowWifiTrouble(!showWifiTrouble)}
                className="w-full flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 transition-all font-bold uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>
                    {lang === "he" 
                      ? "⚠️ פתרון תקלות חיבור (למה ה-Wi-Fi נכשל?)" 
                      : "⚠️ Wi-Fi Troubleshooting Guide"}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showWifiTrouble ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showWifiTrouble && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3 space-y-4 text-xs"
                  >
                    <div className="p-4 bg-black/50 border border-white/5 rounded-2xl space-y-4 text-[11px] leading-relaxed text-white/70">
                      <p className="font-bold text-amber-400 border-b border-white/5 pb-2">
                        {lang === "he"
                          ? `אם המכשיר מנסה להתחבר ל-"ESP32-POV-HOLOGRAPH" (סיסמה: HologramEngine101) אך נכשל או מתנתק מיד, הנה 3 פתרונות חומרה ומערכת הכרחיים:`
                          : `If your phone tries to connect to "ESP32-POV-HOLOGRAPH" (Password: HologramEngine101) but fails/disconnects immediately, apply these 3 essential fixes:`}
                      </p>

                      {/* Power Issues */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-black text-white">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          <span>
                            {lang === "he" 
                              ? "1. נפילת זרם ובקרה פיזית (Power Brownout) ⚡" 
                              : "1. USB Power Voltage Drops (Power Brownout) ⚡"}
                          </span>
                        </div>
                        <p className="pl-3 text-white/50">
                          {lang === "he"
                            ? "הבקר צורך זרם גבוה (Zaps) ברגע שמכשיר מתחבר ל-WiFi שלו. אם הוא מוזן מיציאת USB חלשה של המחשב או דרך כבל פשוט/ארוך, הבקר יקרוס ויבצע Reset מיידי. מניעת קריסות: חבר ישירות למטען קיר חזק 5V/2A עם כבל איכותי וקצר."
                            : "Microcontrollers draw high current spikes (~400mA) when starting cellular/Wi-Fi authentication. If powered by a laptop USB port or long thin cable, the ESP32 brownouts and resets instantly. Solution: Plug into a dedicated 5V/2A wall charger with a short, thick USB cable."}
                        </p>
                      </div>

                      {/* Smart Wi-Fi Drop */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-black text-white">
                          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                          <span>
                            {lang === "he" 
                              ? "2. נטרול אינטרנט סלולרי זמנית 📶" 
                              : "2. Disable Mobile Data / Smart Network Switch 📶"}
                          </span>
                        </div>
                        <p className="pl-3 text-white/50">
                          {lang === "he"
                            ? "מאחר שרשת המאוורר לא מספקת אינטרנט, הטלפון מניח שהחיבור לא תקין ומנתק אותו לטובת גלישה סלולרית. כבה את הנתונים הסלולריים (Cellular Data) בטלפון לפני החיבור, וכשהמערכת מתריעה 'אין חיבור לאינטרנט' - לחץ על 'השאר חיבור פעיל'."
                            : "Because the POV AP does not supply internet access, smart mobile devices automatically abandon the link in favor of cellular. Turn off Mobile/Cellular Data entirely before pairing. If prompted with 'No Internet Connection', tap 'Stay Connected'."}
                        </p>
                      </div>

                      {/* Static IP configuration */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-black text-white">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          <span>
                            {lang === "he" 
                              ? "3. מעבר לכתובת IP סטטית (Static IP) ⚙️" 
                              : "3. Configure Static IP on Your Smartphone ⚙️"}
                          </span>
                        </div>
                        <p className="pl-3 text-white/50 max-w-full overflow-hidden break-words whitespace-pre-line">
                          {lang === "he"
                            ? "אם הגדרת ה-DHCP של ה-ESP32 אטית מידי, המכשיר יכשל בקבלת IP. הפתרון: היכנס להגדרות ה-Wi-Fi של רשת ESP32-POV-HOLOGRAPH בטלפון, שנה הגדרות IP ל-סטטי (Static) והזן:\n• IP: 192.168.4.15\n• Gateway: 192.168.4.1\n• Subnet: 255.255.255.0"
                            : "Some devices fail to obtain IP dynamically from the small ESP32 DHCP stack. Workaround: Go into your phone WiFi details for 'ESP32-POV-HOLOGRAPH', modify IP configuration to 'Static', and fill manually:\n• Client IP: 192.168.4.15\n• Router/Gateway: 192.168.4.1\n• Subnet mask: 255.255.255.0"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        {/* SD Card Storage Section */}
        <motion.section 
          id="sd-storage"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <HardDrive className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "אחסון כרטיס SD" : "SD Card Storage"}</h2>
            </div>
            <div className="text-[9px] font-bold text-amber-500 bg-amber-950/20 px-2 py-1 rounded">
              8GB MOUNTED
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lang === "he" ? "שטח בשימוש" : "USED SPACE"}</span>
                <span className="text-[10px] font-mono font-bold text-amber-500">2.1 GB / 7.4 GB</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[28%] h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => document.getElementById('sd-file-upload')?.click()}
                className="group border-2 border-dashed border-white/5 hover:border-amber-500/30 rounded-2xl p-6 text-center transition-all cursor-pointer bg-black/10"
              >
                <UploadCloud className="w-8 h-8 mx-auto mb-3 text-white/20 group-hover:text-amber-500 transition-colors" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                  {lang === "he" ? "העלאת קבצים ישירות לכרטיס ה-SD" : "Upload files to SD Card"}
                </p>
                <input id="sd-file-upload" type="file" className="hidden" multiple onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    addTerminalLog("SYSTEM", `Uploading ${files.length} files to SD Card...`);
                  }
                }} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="holo-label">{lang === "he" ? "קבצים בכרטיס" : "FILES ON CARD"}</label>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {["logo.bin", "anim_fire.pov", "config.bak", "debug.log"].map((file, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-xs font-mono text-white/60">{file}</span>
                    <button className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase">{lang === "he" ? "מחק" : "Delete"}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Global GPIO Pin Config */}
        <motion.section 
          id="gpio-config"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card border-cyan-500/10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <LayoutGrid className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "הגדרת פינים (GPIO)" : "GPIO Pin Configuration"}</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="holo-label">{lang === "he" ? "פין זרוע א' (D)" : "Arm A Pin (D)"}</label>
                <input 
                  type="number" 
                  value={config.pinArmA} 
                  onChange={(e) => handleConfigChange({ pinArmA: parseInt(e.target.value) })}
                  className="holo-input w-full text-center font-bold text-cyan-400" 
                />
              </div>
              <div className="space-y-2">
                <label className="holo-label">{lang === "he" ? "פין זרוע ב' (D)" : "Arm B Pin (D)"}</label>
                <input 
                  type="number" 
                  value={config.pinArmB} 
                  onChange={(e) => handleConfigChange({ pinArmB: parseInt(e.target.value) })}
                  className="holo-input w-full text-center font-bold text-cyan-400" 
                  disabled={config.wiringType === "continuous"}
                />
              </div>
              <div className="space-y-2">
                <label className="holo-label">{lang === "he" ? "פין חיישן HALL" : "Hall Sensor Pin"}</label>
                <input 
                  type="number" 
                  value={config.pinHall} 
                  onChange={(e) => handleConfigChange({ pinHall: parseInt(e.target.value) })}
                  className="holo-input w-full text-center font-bold text-emerald-400" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[4px]">{lang === "he" ? "ממשק כרטיס SD (SPI)" : "SD CARD INTERFACE (SPI)"}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="holo-label !text-[8px]">CS</label>
                  <input type="number" value={config.pinSD_CS} onChange={(e) => handleConfigChange({ pinSD_CS: parseInt(e.target.value) })} className="holo-input w-full text-center text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="holo-label !text-[8px]">MOSI</label>
                  <input type="number" value={config.pinSD_MOSI} onChange={(e) => handleConfigChange({ pinSD_MOSI: parseInt(e.target.value) })} className="holo-input w-full text-center text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="holo-label !text-[8px]">MISO</label>
                  <input type="number" value={config.pinSD_MISO} onChange={(e) => handleConfigChange({ pinSD_MISO: parseInt(e.target.value) })} className="holo-input w-full text-center text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="holo-label !text-[8px]">SCK</label>
                  <input type="number" value={config.pinSD_SCK} onChange={(e) => handleConfigChange({ pinSD_SCK: parseInt(e.target.value) })} className="holo-input w-full text-center text-xs" />
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleSave(lang === "he" ? "הגדרות פינים נשמרו" : "GPIO Pins Saved")}
              className="w-full py-4 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
            >
              <Save className="w-4 h-4 mx-auto mb-1 opacity-50" />
              {lang === "he" ? "עדכן פינים בחומרה" : "Update GPIO Pins"}
            </button>
          </div>
        </motion.section>

        {/* Custom Logo Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card"
        >
          <div className="flex items-center gap-3 mb-8">
            <ImageIcon className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "לוגו מותאם אישית" : "Custom Logo"}</h2>
          </div>

          <div 
            className="border-2 border-dashed border-white/5 hover:border-cyan-500/50 rounded-3xl p-12 text-center cursor-pointer transition-all bg-black/20 group mb-8"
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold mb-2 uppercase tracking-tight">{lang === "he" ? "העלה קובץ לוגו (PNG, JPG, SVG)" : "Upload Logo (PNG, JPG, SVG)"}</h4>
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{lang === "he" ? "גרור לכאן או לחץ לבחירת קובץ" : "Drag & drop or click to select image"}</p>
            <input id="file-upload-input" type="file" className="hidden" accept="image/*" onChange={handleManualFileSelect} />
          </div>

          <div className="flex justify-between items-center mb-6 px-2">
             <div className="flex gap-4">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lang === "he" ? "תמונה" : "IMAGE"}</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lang === "he" ? "עיבוד" : "PROCESS"}</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lang === "he" ? "הגדרות" : "SETTINGS"}</span>
             </div>
             <span className="text-[10px] font-bold text-white/20 font-mono tracking-[4px]">(FILTER-MATRIX)</span>
          </div>

          <div className="space-y-4">
             <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[4px] mb-4 border-b border-white/5 pb-2">{lang === "he" ? "לוגואים מוכנים בשניות" : "INSTANT LOGO PRESETS"}</h5>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'atom', label: 'Atom', icon: '⚛️' },
                  { id: 'bio', label: 'Biohazard', icon: '⚠️' },
                  { id: 'yin', label: 'YinYang', icon: '☯️' },
                  { id: 'inv', label: 'Invader', icon: '👾' },
                  { id: 'geo', label: 'Geometric', icon: '💠' }
                ].map(logo => (
                  <button 
                    key={logo.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTerminalLogs(prev => [{ time: new Date().toLocaleTimeString(), type: "SYSTEM", msg: `Generated Preset: ${logo.label}` }, ...prev]);
                      // For now just toggle effect 0
                      handleConfigChange({ activeEffect: 0 });
                    }}
                    className="holo-card p-3 flex items-center gap-3 hover:bg-white/5 active:scale-95 transition-all text-sm font-bold"
                  >
                    <span className="text-lg">{logo.icon}</span>
                    {logo.label}
                  </button>
                ))}
             </div>
          </div>
        </motion.section>

        {/* Color & Memory Mode Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card"
        >
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "מצב צבע וזיכרון (ESP32)" : "Color & Memory Mode"}</h2>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="holo-label">{lang === "he" ? "קצב רענון נתונים" : "Data Refresh Rate"}</label>
                 <div className="relative group">
                    <select className="holo-input w-full appearance-none pr-10 font-bold">
                       <option>TURBO (Maximum Throughput)</option>
                       <option>STABLE (Recommended)</option>
                       <option>LOW POWER</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                 </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lang === "he" ? "שימוש בזיכרון RAM" : "RAM USAGE"}</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">12.4 KB / 320 KB</p>
                 </div>
                 <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[4%] h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 </div>
              </div>
           </div>
        </motion.section>

        {/* AI Gemini Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card border-cyan-500/20 bg-gradient-to-b from-[#141414] to-[#0a0a0a]"
        >
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center border border-cyan-400/20">
               <Zap className="w-6 h-6 text-cyan-400" />
             </div>
             <h2 className="text-lg font-bold tracking-tight">
               AI (GEMINI) <span className="text-white/40 font-medium">מחולל לוגו הולוגרפי</span>
             </h2>
          </div>

          <div className="space-y-6">
             <p className="text-xs text-[#a0a0a0] font-bold px-1">{lang === "he" ? ":הזן הנחיה ליצירת לוגו נכון קונטראסטי" : "Enter prompt for contrast-optimized design:"}</p>
             <textarea 
               value={aiPrompt}
               onChange={(e) => setAiPrompt(e.target.value)}
               placeholder={lang === "he" ? "...הקלד הנחיה לג'מיני (לדוגמה: לב נאו כחול, חללית תלת מימדית)" : "Describe something for Gemini (e.g. 3D spaceship, neon cyan heart)..."}
               className="holo-input w-full min-h-[100px] resize-none bg-black/40 text-sm leading-relaxed"
             />
             <button 
               onClick={handleGenerateAiLogo}
               disabled={isAiGenerating}
               className="w-full py-4 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-[2px] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
             >
               {isAiGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
               GEMINI AI {lang === "he" ? "ייצר לוגו עם" : "GENERATE LOGO"}
             </button>
          </div>
        </motion.section>

        {/* Simulator Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6 text-center"
        >
           <h2 className="text-xl font-bold tracking-tight text-cyan-400">{lang === "he" ? "סימולטור הולוגרמה בזמן אמת" : "Real-time Hologram Simulator"}</h2>
           <p className="text-[10px] font-bold text-white/30 uppercase tracking-[4px]">PERSISTENCE OF VISION SWEEP TRAIL</p>
           
           <div className="relative w-full aspect-square max-w-sm mx-auto p-4 bg-black/40 rounded-full border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
             <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 text-[10px] font-mono font-bold text-cyan-400/40 tracking-widest z-10">
                <span>RPM: {config.rpm}</span>
                <span>FPS: 60</span>
             </div>
             <POVSimulator config={config} polarData={polarData} showPhysicalRotor={showPhysicalRotor} hallSensorOffset={config.hallOffset} simSpeed={simSpeed} isCalibrating={isCalibrating} />
           </div>

           <div className="flex gap-4 max-w-xs mx-auto">
              <button onClick={() => setShowPhysicalRotor(true)} className={`flex-1 py-4 px-6 rounded-2xl border text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${showPhysicalRotor ? "bg-white/5 border-white/20 text-white" : "border-white/5 text-white/30"}`}>
                <Settings className="w-4 h-4 opacity-50" />
                {lang === "he" ? "הצג זרועות להב" : "Physical Rotor"}
              </button>
              <button onClick={() => setShowPhysicalRotor(false)} className={`flex-1 py-4 px-6 rounded-2xl border text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${!showPhysicalRotor ? "bg-cyan-500 border-cyan-400 text-black shadow-lg" : "border-white/5 text-white/30 hover:bg-white/5"}`}>
                <Eye className="w-4 h-4" />
                {lang === "he" ? "הצג תצוגת POV" : "POV Display"}
              </button>
           </div>
        </motion.section>

        {/* ESP32 Terminal/Terminal Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card"
        >
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="bg-[#1a1a1a] p-2 rounded-lg border border-white/5">
                    <ChevronDown className="-rotate-90 w-5 h-5 text-cyan-400" />
                 </div>
                 <h2 className="text-lg font-bold tracking-tight uppercase text-white/80">{lang === "he" ? "ESP32 מסוף תקשורת" : "ESP32 COMMUNICATION"}</h2>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-cyan-950/20 border border-cyan-500/20 px-2 py-1 rounded text-[9px] font-bold text-cyan-400 tracking-widest uppercase">
                    {lang === "he" ? "IP: 192.168.4.1" : "IP: 192.168.4.1"}
                 </div>
                 <div className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border ${
                    wifiStatus === "connected" 
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-500" 
                      : wifiStatus === "connecting"
                      ? "bg-amber-950/20 border-amber-500/20 text-amber-500"
                      : "bg-red-950/20 border-red-500/20 text-red-500"
                  }`}>
                    {wifiStatus === "connected" ? "WIFI ACTIVE" : wifiStatus === "connecting" ? "CONNECTING" : "OFFLINE"}
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-[2px]">
                 <span>{lang === "he" ? "ביטים שנשלחו (UART SERIAL MONITOR)" : "SENT BITS (UART SERIAL MONITOR)"}</span>
                 <button className="underline decoration-dotted">{lang === "he" ? "נקה מסך" : "CLEAR"}</button>
              </div>
              <div className="bg-black/60 border border-white/5 rounded-2xl h-64 overflow-y-auto p-6 font-mono text-[11px] space-y-4 scrollbar-thin">
                 {terminalLogs.map((log, i) => (
                   <div key={i} className="flex flex-col gap-1.5 pb-4 border-b border-white/5 last:border-0">
                      <div className="flex justify-between items-center bg-white/5 p-1.5 rounded-lg">
                        <span className="text-white/20">{log.time}</span>
                        <span className={`font-black tracking-widest ${log.type === "SYSTEM" ? "text-cyan-400" : "text-amber-400"}`}>👉 {log.type}</span>
                      </div>
                      <p className="text-white/60 leading-relaxed pl-2">{log.msg}</p>
                   </div>
                 ))}
                 <div className="flex items-center gap-3 text-cyan-400 animate-pulse">
                    <span className="text-white/20">12:21:00 AM</span>
                    <span className="font-bold">_</span>
                 </div>
              </div>

              <div className="flex gap-3">
                 <input type="text" placeholder="HEX: 41 62 00..." className="flex-1 holo-input font-mono" />
                 <button className="bg-indigo-600 px-6 rounded-xl hover:bg-indigo-500"><Zap className="w-5 h-5" /></button>
              </div>
           </div>
        </motion.section>

        {/* Effect Selector Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
           <h3 className="text-lg font-bold tracking-tight text-cyan-400 px-1">{lang === "he" ? "בחר אפקט תצוגה חי" : "Select Live Display Effect"}</h3>
           <div className="space-y-4">
              {[
                { id: 0, label: lang === "he" ? "לוגו מותאם אישית (העלאה)" : "Custom Logo (Upload)", desc: lang === "he" ? "תצוגת תמונה או לוגו שהועלו על ידך ועובדו לקוארדינטות קוטביות" : "Display your uploaded artwork processed into polar coordinates" },
                { id: 1, label: lang === "he" ? "שעון אנלוגי הולוגרפי" : "Holographic Analog Clock", desc: lang === "he" ? "מראה את השעה הנוכחית בזמן אמת עם מחוגי שעות, דקות ושניות זוהרים" : "Real-time analog clock with glowing second, minute, and hour hands" },
                { id: 2, label: lang === "he" ? "מערבולת קשת (Rainbow Wheel)" : "Rainbow Wheel (Vorter)", desc: lang === "he" ? "גלגל צבעים היפנוטי המבוסס על ספקטרום ה-HSV המלא" : "Hypnotic color wheel based on the full HSV spectrum" },
                { id: 12, label: lang === "he" ? "ענני פלזמה (Plasma)" : "Plasma Clouds", desc: lang === "he" ? "ערפילית אלקטרונית מתחלפת בין כחול לסגול" : "Procedural nebula-like plasma clouds shifting dynamically" }
              ].map(eff => (
                <div key={eff.id} className={`holo-card transition-all cursor-pointer group ${config.activeEffect === eff.id ? "border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/20" : "hover:bg-white/5"}`} onClick={() => handleConfigChange({ activeEffect: eff.id })}>
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h4 className="font-bold tracking-tight group-hover:text-cyan-400 transition-colors uppercase">{eff.label}</h4>
                        <p className="text-[10px] text-white/40 font-bold leading-relaxed">{eff.desc}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${config.activeEffect === eff.id ? "bg-cyan-500 text-black border-cyan-400" : "bg-black/40 text-white/20 border-white/5"}`}>
                        {eff.id.toString().padStart(2, '0')}
                      </div>
                   </div>
                   {config.activeEffect === eff.id && (
                     <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] font-bold uppercase text-white/40 tracking-widest font-mono">
                              <span>{lang === "he" ? "מהירות אפקט" : "Effect Speed"}</span>
                              <span className="text-cyan-400">100%</span>
                           </div>
                           <input type="range" className="w-full accent-cyan-500 h-1.5" />
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] font-bold uppercase text-white/40 tracking-widest font-mono">
                              <span>{lang === "he" ? "עוצמת צבע" : "Color Intensity"}</span>
                              <span className="text-cyan-400">100%</span>
                           </div>
                           <input type="range" className="w-full accent-cyan-500 h-1.5" />
                        </div>
                     </div>
                   )}
                </div>
              ))}
           </div>
        </motion.section>

        {/* Calibration Section */}
        <motion.section 
          id="calibration"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="holo-card"
        >
           <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Crosshair className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">{lang === "he" ? "כיול קוארדינאטות" : "Coordinates Calibration"}</h2>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest font-mono">
                    <label>{lang === "he" ? "בהירות לדים" : "LED Brightness"}</label>
                    <span className="text-indigo-400">{Math.round((config.brightness/255)*100)}%</span>
                 </div>
                 <input type="range" min="0" max="255" value={config.brightness} onChange={(e) => setConfig({...config, brightness: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-2" />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest font-mono">
                    <label>{lang === "he" ? "מהירות סיבוב (RPM)" : "Rotation Speed"}</label>
                    <span className="text-indigo-400">{config.rpm} RPM</span>
                 </div>
                 <input type="range" min="400" max="3000" step="100" value={config.rpm} onChange={(e) => setConfig({...config, rpm: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-2" />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest font-mono">
                    <label>{lang === "he" ? "מהירות סימולציה (תצוגה מקדימה)" : "Simulation Pre-Speed"}</label>
                    <span className="text-indigo-400">{simSpeed}X</span>
                 </div>
                 <input type="range" min="0.1" max="10" step="0.1" value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))} className="w-full accent-purple-500 h-2" />
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <Crosshair className="w-5 h-5 text-cyan-400" />
                       <span className="text-xs font-bold tracking-widest uppercase">HALL (זווית היסט חיישן)</span>
                    </div>
                    <span className="px-3 py-1 bg-cyan-950 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/20">{config.hallOffset}°</span>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="relative w-20 h-20 shrink-0">
                       <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                       <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/5 animate-spin-slow opacity-20" />
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                       <div className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" 
                            style={{ 
                              top: "50%", 
                              left: "50%", 
                              transform: `translate(-50%, -50%) rotate(${config.hallOffset - 90}deg) translate(36px) rotate(${- (config.hallOffset - 90)}deg)` 
                            }} 
                       />
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-32 bg-white/5 -z-10 group-hover:bg-cyan-500/10" />
                       <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-500 rounded-full" />
                    </div>
                    <div className="flex-1 space-y-4">
                       <input type="range" min="0" max="360" value={config.hallOffset} onChange={(e) => handleConfigChange({ hallOffset: parseInt(e.target.value) })} className="w-full accent-cyan-500 h-2" />
                       <p className="text-[10px] text-white/30 font-bold leading-relaxed">
                         {lang === "he" 
                           ? "כייל את הזווית לקבלת מירכוז מדויק. הפס האדום מייצג את ציר ה-Y ביחס לחיישן ה-Hall (הנקודה הירוקה)." 
                           : "Calibrate the offset for exact centering. The red line represents Y-axis relative to the Hall Sensor (Green dot)."}
                       </p>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => handleSave(lang === "he" ? "הכיול נשמר" : "Calibration Saved")}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
              >
                {lang === "he" ? "שמור הגדרות כיול" : "Save Calibration"}
              </button>
           </div>
        </motion.section>

        {/* Global Action Footer */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
           <AnimatePresence>
             {saveStatus && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="absolute -top-16 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap"
               >
                 {saveStatus}
               </motion.div>
             )}
           </AnimatePresence>
           
           <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl flex gap-2">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex-1 py-4 flex flex-col items-center gap-1 text-[9px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                <Smartphone className="w-4 h-4 mb-1" />
                DASHBOARD
              </button>
              <button 
                onClick={handleSync}
                className="flex-1 py-4 bg-cyan-500 text-black rounded-2xl flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                 <Play className="w-4 h-4 mb-1" />
                 SYNC LIVE
              </button>
              <button 
                onClick={() => document.getElementById('hw-specs')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-1 py-4 flex flex-col items-center gap-1 text-[9px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 mb-1" />
                CONFIG
              </button>
           </div>
        </div>

      </main>

      <footer className="max-w-xl mx-auto py-20 text-center space-y-4">
         <div className="flex justify-center gap-8 text-white/10">
            <Zap className="w-4 h-4" />
            <Cpu className="w-4 h-4" />
            <Database className="w-4 h-4" />
         </div>
         <p className="text-[8px] font-black text-white/5 uppercase tracking-[8px]">
           HoloSpin Quantum Engine • v3.4.0 • Node.js Backend
         </p>
      </footer>
    </div>
  );
}
