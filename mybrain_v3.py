from flask import Flask, request
from datetime import datetime, timedelta
import os

app = Flask(__name__)

MD_FILE_PATH = r"C:\Users\ASUS\Documents\MyceliumVault\Environment_sensor_data.md"

# Global variables to track the last saved state for our filtering logic
last_saved_temp = None
last_saved_hum = None
last_saved_time = None

# CONFIGURATION THRESHOLDS (The "Smart Filter" rules)
TEMP_THRESHOLD = 0.3   # Save if temp changes by more than 0.3°C
HUM_THRESHOLD = 1.0    # Save if humidity changes by more than 1.0%
TIME_THRESHOLD_MINS = 30  # Force a save every 30 mins even if no change

def initialize_md_file():
    if not os.path.exists(MD_FILE_PATH):
        with open(MD_FILE_PATH, "w", encoding="utf-8") as f:
            f.write("# Mycelium Integration - Smart Filtered Logs\n\n")
            f.write("| Timestamp | Device | Temperature (°C) | Humidity (%) | Status |\n")
            f.write("| --- | --- | --- | --- | --- |\n")

@app.route("/skin", methods=["POST"])
def skin():
    global last_saved_temp, last_saved_hum, last_saved_time
    
    data = request.json
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    
    device = data.get("device", "Unknown")
    temp = float(data.get("temperature", 0.0))
    hum = float(data.get("humidity", 0.0))

    # Decision Logic: Should we save this data point?
    should_save = False
    reason = "Ignored (Stable)"

    if last_saved_time is None:
        # Always save the very first reading when the server starts
        should_save = True
        reason = "Initial Reading"
    else:
        # Calculate changes
        temp_diff = abs(temp - last_saved_temp)
        hum_diff = abs(hum - last_saved_hum)
        time_diff = now - last_saved_time

        # Check conditions
        if temp_diff >= TEMP_THRESHOLD:
            should_save = True
            reason = f"Temp Jump (+-{temp_diff:.1f}°C)"
        elif hum_diff >= HUM_THRESHOLD:
            should_save = True
            reason = f"Hum Jump (+-{hum_diff:.1f}%)"
        elif time_diff >= timedelta(minutes=TIME_THRESHOLD_MINS):
            should_save = True
            reason = "Time Interval Override"

    # Console output for real-time tracking
    print("----------------------")
    print(f"[{timestamp}] Incoming: {temp}°C, {hum}% -> {reason}")

    if should_save:
        # Update our tracking memory
        last_saved_temp = temp
        last_saved_hum = hum
        last_saved_time = now

        # Write to the Markdown table
        try:
            with open(MD_FILE_PATH, "a", encoding="utf-8") as f:
                f.write(f"| {timestamp} | {device} | {temp} | {hum} | {reason} |\n")
            print("💾 Saved to file.")
        except Exception as e:
            print(f"Error writing to file: {e}")
    else:
        print("⏳ Data stable. Skipped saving to prevent flooding.")

    return "OK"

if __name__ == "__main__":
    initialize_md_file()
    app.run(host="0.0.0.0", port=5000)