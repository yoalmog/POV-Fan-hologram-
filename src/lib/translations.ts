export interface TranslationSet {
  title: string;
  subtitle: string;
  connected: string;
  disconnected: string;
  selectEffect: string;
  calibration: string;
  brightness: string;
  rotationSpeed: string;
  hallOffset: string;
  uploadLogo: string;
  aiLogoGen: string;
  aiPromptPlaceholder: string;
  generateBtn: string;
  generating: string;
  pushToDevice: string;
  downloadCode: string;
  simSpeed: string;
  simDir: string;
  clockwise: string;
  counterClockwise: string;
  wiringLayout: string;
  wiringContinuous: string;
  wiringReverse: string;
  wiringSeparate: string;
  colorFormat: string;
  arduinoCode: string;
  activeProfile: string;
  presetsTitle: string;
  previewLogo: string;
  polarArrayMap: string;
  simulatorTitle: string;
  pcbVisibility: string;
  sensorVisibility: string;
  trailVisibility: string;
  serialMonitor: string;
  baudRate: string;
  clearTerminal: string;
  infoTitle: string;
  infoSec1: string;
  infoSec2: string;
  infoSec3: string;
  uploadedStatus: string;
  generatedStatus: string;
  errorGen: string;
  copySuccess: string;
  copyBtn: string;
  downloadIno: string;
  downloadH: string;
}

export const translations: { he: TranslationSet; en: TranslationSet } = {
  he: {
    title: "בקר הולוגרמת לדים - HoloSpin POV",
    subtitle: "בקר זרוע כפולה WS2812B • תקשורת ESP32 Wi-Fi פעילה",
    connected: "ESP32: מחובר",
    disconnected: "ESP32: מנותק",
    selectEffect: "בחר אפקט תצוגה",
    calibration: "כיול ופרמטרים של המכשיר",
    brightness: "בהירות לדים",
    rotationSpeed: "מהירות סיבוב (RPM)",
    hallOffset: "זווית היסט חיישן Hall",
    uploadLogo: "העלאת לוגו חדש",
    aiLogoGen: "מחולל לוגו הולוגרפי בטכנולוגיית Gemini AI",
    aiPromptPlaceholder: "תאר את הלוגו שברצונך ליצור (למשל: דרקון סייבר ירוק זוהר, סמל רנטגן, גלגל שיניים עתידני)...",
    generateBtn: "צור לוגו עם AI",
    generating: "יוצר לוגו...",
    pushToDevice: "שדר למערכת לטווח קצר",
    downloadCode: "ייצא קוד ESP32 מושלם",
    simSpeed: "מהירות ריצה בסימולציות",
    simDir: "כיוון סיבוב",
    clockwise: "עם כיוון השעון",
    counterClockwise: "נגד כיוון השעון",
    wiringLayout: "סוג חיבור לדים פיזי",
    wiringContinuous: "פס רציף אחד מקופל כפול (0-89)",
    wiringReverse: "פס רציף כשהזרוע השנייה הפוכה",
    wiringSeparate: "שני פסים נפרדים עם פינים שונים בבקר",
    colorFormat: "פורמט קידוד צבעים (לחיסכון בזיכרון)",
    arduinoCode: "מחולל קוד C++ ל-ESP32 Dev Module",
    activeProfile: "פרופיל פעיל כעת",
    presetsTitle: "לוגואים לדוגמה מובנים",
    previewLogo: "תצוגת תמונה מקורית",
    polarArrayMap: "מפת מערך קוטבי (Polar Coordinates Map)",
    simulatorTitle: "סימולטור הולוגרמה תלת-ממדי POV",
    pcbVisibility: "הצג זרועות PCB פיזיות",
    sensorVisibility: "הצג חיישן Hall ומגנט סנכרון",
    trailVisibility: "אפקט השארת שובל אור (Persistence Trail)",
    serialMonitor: "מוניטור סריאלי ESP32 Wi-Fi",
    baudRate: "קצב שידור",
    clearTerminal: "נקה מסוף",
    infoTitle: "כיצד המערכת ההולוגרפית עובדת?",
    infoSec1: "1. זיהוי מיקום בזמן אמת: ברגע שהזרוע המסתובבת חולפת על פני המגנט, חיישן ה-Hall Effect שולח אות פעימה LOW לפין פסיקה בארדואינו (פין 2 או 3).",
    infoSec2: "2. חישוב מהירות מדויק: הבקר מודד את הזמן שעבר בין שני פולסים עוקבים במיקרו-שניות ומחלק זמן זה ל-120 מגזרים (Sectors) שווים לסיבוב מלא.",
    infoSec3: "3. עדכון לדים בPOV: לכל מגזר, הבקר מדליק את 45 הלדים שעל הזרוע בצבעים המתאימים. בקר ה-ESP32 משמש לשליטה מרחוק באפקטים, צבעים ופרמטרים דרך רשת ה-Wi-Fi.",
    uploadedStatus: "הלוגו שהועלה מוכן ומקודד!",
    generatedStatus: "לוגו ה-AI של Gemini מוכן ומקודד קוטבית!",
    errorGen: "שגיאה ביצירת הלוגו. נסה שוב.",
    copySuccess: "הקוד הועתק בהצלחה!",
    copyBtn: "העתק קוד",
    downloadIno: "הורד קובץ HoloSpin_POV.ino",
    downloadH: "הורד קובץ HoloSpin_Config.h"
  },
  en: {
    title: "HoloSpin POV — LED Hologram Manager",
    subtitle: "Dual-Arm WS2812B Controller • Active ESP32 Wi-Fi Interface",
    connected: "ESP32: CONNECTED",
    disconnected: "ESP32: DISCONNECTED",
    selectEffect: "Select Hologram Effect",
    calibration: "Physical Calibration & Calibration Settings",
    brightness: "LED Brightness Intensity",
    rotationSpeed: "Rotor Speed (RPM)",
    hallOffset: "Hall Effect Timing Angle Offset",
    uploadLogo: "Upload Custom Artwork file",
    aiLogoGen: "Holographic AI Logo Generator powered by Gemini",
    aiPromptPlaceholder: "Describe your hologram logo (e.g., Glowing neon cyber dragon, biotech hazard star, glowing vector smiley face)...",
    generateBtn: "Generate Logo with Gemini",
    generating: "Generating Artwork...",
    pushToDevice: "Push Command to Device",
    downloadCode: "Export ESP32 Dev Module Firmware",
    simSpeed: "Simulator Refresh Cadence",
    simDir: "Rotation Direction",
    clockwise: "Clockwise (CW)",
    counterClockwise: "Counter-Clockwise (CCW)",
    wiringLayout: "Physical LED Strip Wiring Layout",
    wiringContinuous: "Single long continuous folded strip (0-89)",
    wiringReverse: "Continuous strip with Arm 2 indices flipped",
    wiringSeparate: "Two separate strips wired to unique controller pins",
    colorFormat: "Color Packing Code Style (Optimizes RAM)",
    arduinoCode: "ESP32 Dev Module Complete Firmware C++ Source Code",
    activeProfile: "Active Profile",
    presetsTitle: "High-Contrast Native Presets",
    previewLogo: "Input Reference Image",
    polarArrayMap: "Radial Polar Array Map Layout (120x45)",
    simulatorTitle: "3D Dynamic POV Hologram Rotor Simulator",
    pcbVisibility: "Render Physical PCB Spinning Arms",
    sensorVisibility: "Render Hall Magnet Timing Sync Trigger",
    trailVisibility: "Persistence of Vision Trails (POV Mode)",
    serialMonitor: "ESP32 Wi-Fi Network Console",
    baudRate: "Serial Speed",
    clearTerminal: "Clear Console",
    infoTitle: "How does the rotating POV system operate?",
    infoSec1: "1. Angular Position Reference: When the spinning PCB sweeps past the magnet, the Hall effect sensor sends a LOW signal pulse triggering a hardware interrupt (Pin 2).",
    infoSec2: "2. Exact RPM Timers: The micro-controller measures the elapsed rotation period in microseconds using micros() and slices that timing window into exactly 120 sectors.",
    infoSec3: "3. Direct Sector Painting: Inside each sector, FastLED updates the 45 LEDs on both arms. ESP32 Wi-Fi server processes remote change events instantly from this terminal.",
    uploadedStatus: "Custom image parsed & mapped successfully!",
    generatedStatus: "Gemini AI logo painted and converted to polar map!",
    errorGen: "Failed to generate AI logo. Please test key.",
    copySuccess: "C++ layout copied to clipboard!",
    copyBtn: "Copy to Clipboard",
    downloadIno: "Download HoloSpin_POV.ino",
    downloadH: "Download HoloSpin_Config.h"
  }
};
