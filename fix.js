import fs from 'fs';
let content = fs.readFileSync('src/components/BluetoothTerminal.tsx', 'utf8');
content = content.replace(/HC-05/g, "ESP32");
content = content.replace(/HC-06/g, "ESP32");
content = content.replace(/רשימת מכשירים שעברו צימוד ב-Android/g, "התקנים שזורים לחיבור מהיר"); // user's exact phrase
content = content.replace(/Bonded ESP32 modules in OS registry/g, "Saved ESP32 modules for quick connection");
content = content.replace(/לחץ לחיבור מיידי מתוך היסטוריית ה-ESP32 שלך/g, "לחץ לחיבור מיידי לרכיבי ה-ESP32 שלך");
content = content.replace(/Select and reconnect instantly without polling\/scanning/g, "Select and reconnect instantly out of saved devices");
fs.writeFileSync('src/components/BluetoothTerminal.tsx', content);
