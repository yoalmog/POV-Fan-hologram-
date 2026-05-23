# Guide: Turning POV-Fan-Hologram into a Real Android APK (With Bluetooth Permissions)

This guide explains how to fix your Termux issues, build a native Android APK using **CapacitorJS**, and configure the necessary Android permissions to connect with your **HC-05 Bluetooth module**.

---

## Part 1: Solving the Termux `npm install` EACCES / Symlink Error
When you run `npm install` inside `/storage/emulated/0/Download/...` (which maps to your Android Shared Storage), Android uses a partition format (like FUSE, exFAT, or emulated SDCardfs) which **does not support symlinks**. Node/npm requires symlinks in `node_modules/.bin` to map CLI commands.

### Solution A: Install in Termux Native Home Directory (Recommended / Fastest)
Copy the project to Termux's isolated local memory (`ext4` filesystem), where symlinks are fully supported:

```bash
# 1. Create a folder in your native Termux home directory
mkdir -p ~/POV-Fan-hologram

# 2. Copy all files from Downloads to the new directory
cp -r /storage/emulated/0/Download/POV-Fan-hologram--main/POV-Fan-hologram--main/* ~/POV-Fan-hologram/

# 3. Enter the native directory
cd ~/POV-Fan-hologram

# 4. Install dependencies successfully!
npm install
```

### Solution B: Install in place by bypassing symlinks
If you absolutely must stay inside the `/Download/` path, run:
```bash
npm install --no-bin-links
```

---

## Part 2: Converting This React + Vite App into a Real Android APK (.apk)
To run your POV Hologram Controller as a native phone app, we will use **CapacitorJS**—the leading wrapper that embeds React into native Kotlin/Java shells.

### 1. Initialize Capacitor in the Project
Run the following commands inside your Termux or computer project folder:
```bash
# Install Capacitor core & CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor (use "Hologram Controller" as Name and "com.povfan.holo" as ID)
npx cap init "Hologram Controller" "com.povfan.holo" --web-dir=dist
```

### 2. Configure Capacitor and Build
Open `capacitor.config.json` (or `capacitor.config.ts`) created in your root and ensure the `webDir` is set to `"dist"`.

Now, perform your web build:
```bash
# Build the production React files
npm run build
```

### 3. Add Android Platform Support
```bash
# Install the Android package
npm install @capacitor/android

# Add the Android platform project code
npx cap add android
```
This generates a fully functional, native Android Studio project folder under the `/android` directory.

---

## Part 3: Adding Bluetooth & Location Permissions to Android Manifest
On Android devices, scanning and communicating over Bluetooth requires explicit user permissions in the system. 

Open the newly created Android manifest file located at:
`android/app/src/main/AndroidManifest.xml`

### 1. Add the following permission nodes
Paste these elements directly inside the `<manifest>` tag, above your `<application>` block:

```xml
<!-- General Bluetooth Permissions (Classic Bluetooth like HC-05) -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

<!-- Location Permissions (Needed for older Android versions to discover Bluetooth devices) -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Special Android 12+ Bluetooth Permissions (Required on modern phones!) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" 
                 android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- Optional: Declares that the app uses BLE (disable if you strictly use Classic HC-05) -->
<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
```

---

## Part 4: Connecting Core React Code to Hardware on Android
There are two different ways your phone connects to the Arduino's **HC-05**:

### Way A: Web Serial (with a USB OTG Cable)
If you connect your phone directly to the Arduino's USB port using an **OTG adapter**, our newly added **Web Serial** connection option in the app will work perfectly inside standard Google Chrome or your compiled Capacitor app (with a Serial port bridge).

### Way B: HC-05 Classic Bluetooth Connection
The **HC-05 is a Bluetooth Classic (SPP Profile)** adapter. 
* Browsers support `Web Bluetooth` primarily for **Bluetooth Low Energy (BLE)** devices (like HM-10, MLT-BT05, or CC2541).
* To handle **Classic Bluetooth** in your native APK, you need to add an Android Bluetooth plugin to your Capacitor app.

#### 1. Install Capacitor Community Bluetooth serial Plugin
```bash
npm install cordova-plugin-bluetooth-serial
npm install @awesome-cordova-plugins/bluetooth-serial
npx cap sync
```

#### 2. Intercept Tx Transfers in React
In `src/components/BluetoothTerminal.tsx`, when sending hexadecimal sequences, we can route them directly to this plugin when running on native platforms:

```javascript
// Inside your transmission function:
if (window.hasOwnProperty('cordova')) {
  // We are running inside a real native APK!
  (window as any).bluetoothSerial.write(bytes, () => {
    console.log("Bytes pushed to HC-05 successfully!");
  }, (err: any) => {
    console.error("Transmission failed:", err);
  });
}
```

---

## Part 5: Generating and Compiling the Final APK
If you are running on desktop, you can compile the APK immediately using Android Studio:

```bash
# Synchronize web changes into the Android Studio folder
npx cap sync

# Open the Android Studio compiler environment
npx cap open android
```
1. Once **Android Studio** loads, select `Build` from the top menu toolbar.
2. Click **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
3. Android Studio will compile and output your custom `app-debug.apk` directly!
4. Install this file on your phone, accept the Bluetooth pairing prompts, and your hologram POV Fan is fully controller-driven!
