export interface POVConfig {
  numLeds: number;         // Default: 45 (LEDs per arm)
  numArms: number;         // Default: 2
  numSectors: number;      // Default: 120 (Sectors per full 360 degree rotation)
  rpm: number;             // Default: 1200 (Revolutions per minute)
  wiringType: "continuous" | "reverse" | "separate";
  colorFormat: "RGB888" | "RGB565" | "RGB332" | "MONO";
  activeEffect: number;    // Selected effect index (0 to 24) for Arm A / Global
  activeEffectArmB: number; // Selected effect index (0 to 24) for Arm B
  brightness: number;      // 0 to 255
  scrollText: string;      // Custom text for text scroller (Arm A)
  scrollTextArmB: string;  // Custom text for text scroller (Arm B)
  separateArmControl: boolean; // Enable independent effect configs per arm
  effectSpeed: number;     // 0 to 200, Default 100
  effectIntensity: number; // 0 to 200, Default 100
  effectDensity: number;   // 0 to 200, Default 100
  stripsPerArm: 1 | 3;     // 1 or 3 strips per arm
  pinArmA: number;         // Pin for Arm A, default 6
  pinArmB: number;         // Pin for Arm B, default 7
  pinHall: number;         // Pin for Hall Sensor, default 2
  hallOffset: number;      // -180 to 180 degrees, for hall sensor calibration
  wifiSSID?: string;       // Wi-Fi SSID
  wifiPassword?: string;   // Wi-Fi Password
  pinSD_CS: number;        // SD Card Chip Select
  pinSD_MOSI: number;      // SD Card MOSI
  pinSD_MISO: number;      // SD Card MISO
  pinSD_SCK: number;       // SD Card SCK
  
  // Custom Sync Sequence
  isSequenceActive: boolean;
  sequenceSteps: SyncSequenceStep[];
}

export interface SyncSequenceStep {
  id: string; // UUID
  armA_Effect: number;
  armB_Effect: number;
  durationMs: number; // Duration in milliseconds
}

export interface Effect {
  id: number;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
}

export const SUPPORTED_EFFECTS: Effect[] = [
  {
    id: 0,
    nameHe: "לוגו מותאם אישית (העלאה)",
    nameEn: "Custom Uploaded Logo",
    descriptionHe: "תצוגת תמונה או לוגו שהועלו על ידך ועובדו לקואורדינטות קוטביות",
    descriptionEn: "Displays the custom uploaded image parsed into polar coordinates."
  },
  {
    id: 1,
    nameHe: "שעון אנלוגי הולוגרפי",
    nameEn: "Holographic Analog Clock",
    descriptionHe: "מראה את השעה הנוכחית בזמן אמת עם מחוגי שעות, דקות ושניות זוהרים",
    descriptionEn: "Draws real-time analog clock hands with coordinates calculated on-the-fly."
  },
  {
    id: 2,
    nameHe: "מערבולת קשת (Rainbow Wheel)",
    nameEn: "Vibrant Rainbow Vortex",
    descriptionHe: "גלגל צבעים היפנוטי המבוסס על ספקטרום ה-HSV המלא",
    descriptionEn: "A full-spectrum HSV color wheel rotating dynamically."
  },
  {
    id: 3,
    nameHe: "סורק רדאר צבאי",
    nameEn: "Military Radar Scan",
    descriptionHe: "סמל רדאר ירוק מסתובב עם שובל דועך וסמנים מדומים",
    descriptionEn: "A high-tech green scanning sonar sweep with fade trail."
  },
  {
    id: 4,
    nameHe: "ספירלה היפנוטית כפולה",
    nameEn: "Hypnotic Dual Spiral",
    descriptionHe: "שתי זרועות ספירליות ארכימדיות המתברגות פנימה והחוצה",
    descriptionEn: "Two interlocking Archimedean spirals expanding or contracting."
  },
  {
    id: 5,
    nameHe: "גשם קוד דיגיטלי (מטריקס)",
    nameEn: "Digital Matrix Torrent",
    descriptionHe: "תווים של קוד ירוק נופל בזרימה מעגלית מתפרצת",
    descriptionEn: "Circular strands of code letters raining down from the center."
  },
  {
    id: 6,
    nameHe: "מערבולת טבעות אש",
    nameEn: "Flashing Fire Rings",
    descriptionHe: "חלקיקי אש חמים בגווני צהוב, כתום ואדום היוצרים מערבל לוהט במרכז",
    descriptionEn: "Simulates turbulent orange and red fire sparks swirling around."
  },
  {
    id: 7,
    nameHe: "מנהרת כוכבי חלל",
    nameEn: "Starfield Hyperjump Space",
    descriptionHe: "נסיעה במהירות האור דרך שדה כוכבים מתרחב וגולש לקצוות",
    descriptionEn: "A warp-speed tunnel with stars emerging from the center."
  },
  {
    id: 8,
    nameHe: "מנדלה קליידוסקופית",
    nameEn: "Cybernetic Mandala",
    descriptionHe: "מבנים גיאומטריים משולבים מונפשים בסימטריה מושלמת",
    descriptionEn: "Intricate kaleidoscopic shapes rotating in perfect mathematical symmetry."
  },
  {
    id: 9,
    nameHe: "גלובוס כדור הארץ תלת-ממדי",
    nameEn: "Turning Wireframe Globe",
    descriptionHe: "סקיצה תלת ממדית של כדור הארץ המסתובב על צירו",
    descriptionEn: "A rotating neon coordinate map of the terrestrial globe."
  },
  {
    id: 10,
    nameHe: "לב פועם אלקטרוני",
    nameEn: "Pulsing ECG Cyber Heart",
    descriptionHe: "לב נאון אדום מתרחב ומתכווץ בקצב פעימות לב מהירות",
    descriptionEn: "A neon-red anatomical heart outline pulsing outwards dynamically."
  },
  {
    id: 11,
    nameHe: "טקסט רץ מעגלי",
    nameEn: "Concentric Scroll Text",
    descriptionHe: "הצגת כיתוב מותאם אישית שמסתובב ורץ בגלגול סביב ההולוגרמה",
    descriptionEn: "Scrolls customized marquee text along a circumferential path."
  },
  {
    id: 12,
    nameHe: "ענני פלזמה (Plasma Clouds)",
    nameEn: "Plasma Clouds",
    descriptionHe: "תבניות פלזמה מתחלפות כחול-סגול בסגנון ערפילית אקראית רציפה",
    descriptionEn: "Procedural nebula-like plasma clouds shifting dynamically in blue and violet."
  },
  {
    id: 13,
    nameHe: "שביטי קוואנטום (Quantum Comets)",
    nameEn: "Quantum Comets",
    descriptionHe: "שביטי אור זוהרים החגים במסלולים מתנגשים ומשאירים שובלי פלזמה דועכים",
    descriptionEn: "Glowing light comets flying in intersecting orbital patterns leaving a fading trace."
  },
  {
    id: 14,
    nameHe: "סנכרון - הליקס דנ\"א כפול",
    nameEn: "Sync - Dual DNA Helix",
    descriptionHe: "אפקט מסונכרן: זרוע א' וזרוע ב' משולבות ליצירת סליל דנ\"א מתפתל",
    descriptionEn: "Synchronized: Arm A and Arm B render interlocking sine waves to form a DNA strand."
  },
  {
    id: 15,
    nameHe: "סנכרון - פולס פינג פונג",
    nameEn: "Sync - Ping Pong Pulse",
    descriptionHe: "אפקט מסונכרן: פעימת אנרגיה קופצת ומדלגת בין זרוע א' לזרוע ב'",
    descriptionEn: "Synchronized: An energy pulse bounces directly between Arm A and Arm B using precision positioning."
  },
  {
    id: 16,
    nameHe: "סנכרון - גלגלי שיניים משולבים",
    nameEn: "Sync - Interlocking Gears",
    descriptionHe: "אפקט מסונכרן: ציור של שני מערכות גלגלי שיניים החופפים ומסתובבים בסנכרון מושלם",
    descriptionEn: "Synchronized: Draws cogwheels blending together perfectly using the dual arm mechanical offset."
  },
  {
    id: 17,
    nameHe: "ספירלה היפנוטית",
    nameEn: "Hypnotic Spiral",
    descriptionHe: "זרועות ספירליות המסתובבות ומשנות צבע בקצב משתנה",
    descriptionEn: "Spiral arms twisting and changing colors at a variable rate."
  },
  {
    id: 18,
    nameHe: "סורק מכ\"ם",
    nameEn: "Radar Sweeper",
    descriptionHe: "סריקת מכ\"ם רציפה עם שובל ירוק מהבהב כנקודות חיות",
    descriptionEn: "Continuous radar sweep with a green trail and blinking blips like lifeforms."
  },
  {
    id: 19,
    nameHe: "עיגול אש קינטי",
    nameEn: "Kinetic Fire Ring",
    descriptionHe: "טבעת בוערת רוטטת, המשנה עצימות ואנרגיה כמו שמש מתפוצצת",
    descriptionEn: "A pulsating, vibrating ring of fire shifting energy like a miniature sun."
  },
  {
    id: 20,
    nameHe: "סנכרון - התנגשות חלקיקים",
    nameEn: "Sync - Particle Collision",
    descriptionHe: "אפקט מסונכרן: פוטונים נעים אל המרכז לשתי הזרועות ומתפוצצים החוצה ברסיסים",
    descriptionEn: "Synchronized: Photons race inward from both arms, colliding in the core and exploding outward in fragments."
  },
  {
    id: 21,
    nameHe: "קשת נושמת",
    nameEn: "Breathing Rainbow",
    descriptionHe: "שטיפה חלקה של צבעי הקשת העולה ויורדת בעוצמתה באופן גלי",
    descriptionEn: "A smooth wash of cascading rainbow colors that breathes dynamically."
  },
  {
    id: 22,
    nameHe: "גשם מטריקס",
    nameEn: "Matrix Rain",
    descriptionHe: "קווי אנרגיה ירוקים נופלים פנימה מהקצוות למרכז בדומה לגשם דיגיטלי",
    descriptionEn: "Green energy lines raining inward from the edges to the center like digital rain."
  },
  {
    id: 23,
    nameHe: "סופרנובה פועמת",
    nameEn: "Pulsating Supernova",
    descriptionHe: "כוכב מתרחב ומתכווץ בחוזקה, פולט גלי צבע אקראיים בקצותיו",
    descriptionEn: "A rapidly expanding and contracting star, emitting random colored waves at its edges."
  },
  {
    id: 24,
    nameHe: "טבעת מהבהבת צבעונית",
    nameEn: "Strobe Color Ring",
    descriptionHe: "טבעות מהירות ומהבהבות הנעות החוצה בצבעים עזים, לאפקט אנרגיה גבוה",
    descriptionEn: "Rapidly flashing and moving colored rings pushing outward for a high energy strobe effect."
  }
];
