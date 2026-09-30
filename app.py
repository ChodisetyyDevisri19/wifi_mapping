from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import subprocess
import re
from datetime import datetime


# =========================================================
# FLASK APPLICATION
# =========================================================

app = Flask(__name__)

DATABASE = "wifi_data.db"


# =========================================================
# WIFI NAME -> LOCATION MAPPING
# =========================================================

WIFI_LOCATIONS = {

    # Your current Hostel Wi-Fi
    "ACT-ai_101818820927": "Hostel",

    # Add your college Wi-Fi later like this:
    # "YOUR_COLLEGE_WIFI_NAME": "College"

}


# =========================================================
# DATABASE
# =========================================================

def get_connection():

    connection = sqlite3.connect(
        DATABASE
    )

    connection.row_factory = sqlite3.Row

    return connection


def init_database():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rssi REAL NOT NULL,
            location TEXT NOT NULL,
            ssid TEXT DEFAULT 'Unknown',
            signal_percent REAL DEFAULT 0,
            band TEXT DEFAULT 'Unknown',
            channel TEXT DEFAULT 'Unknown',
            timestamp TEXT NOT NULL
        )
    """)

    connection.commit()

    connection.close()


# =========================================================
# READ LAPTOP WIFI
# =========================================================

def get_wifi_info():

    try:

        output = subprocess.check_output(
            [
                "netsh",
                "wlan",
                "show",
                "interfaces"
            ],
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        # -------------------------------------------------
        # SSID
        # -------------------------------------------------

        ssid_match = re.search(
            r"^\s*SSID\s*:\s*(.+)$",
            output,
            re.MULTILINE
        )

        # -------------------------------------------------
        # SIGNAL
        # -------------------------------------------------

        signal_match = re.search(
            r"Signal\s*:\s*(\d+)\s*%",
            output,
            re.IGNORECASE
        )

        # -------------------------------------------------
        # RSSI
        # -------------------------------------------------

        rssi_match = re.search(
            r"^\s*Rssi\s*:\s*(-?\d+)$",
            output,
            re.MULTILINE | re.IGNORECASE
        )

        # -------------------------------------------------
        # BAND
        # -------------------------------------------------

        band_match = re.search(
            r"^\s*Band\s*:\s*(.+)$",
            output,
            re.MULTILINE
        )

        # -------------------------------------------------
        # CHANNEL
        # -------------------------------------------------

        channel_match = re.search(
            r"^\s*Channel\s*:\s*(.+)$",
            output,
            re.MULTILINE
        )

        # -------------------------------------------------
        # EXTRACT VALUES
        # -------------------------------------------------

        ssid = (
            ssid_match.group(1).strip()
            if ssid_match
            else "Unknown"
        )

        signal = (
            int(signal_match.group(1))
            if signal_match
            else 0
        )

        # -------------------------------------------------
        # RSSI CALCULATION
        # -------------------------------------------------
        #
        # Some Windows Wi-Fi adapters report a stale/fixed
        # Rssi value. Your adapter was repeatedly reporting
        # -56 dBm even when the Signal percentage changed.
        #
        # Therefore we use the live Signal percentage and
        # convert it to an approximate dBm value.
        #
        # Approximation:
        # RSSI ≈ (Signal % / 2) - 100
        #
        # Examples:
        # 84% -> -58 dBm
        # 70% -> -65 dBm
        # 60% -> -70 dBm
        # 50% -> -75 dBm
        # 40% -> -80 dBm
        #
        # This is an estimated RSSI based on Windows Signal %,
        # not a direct hardware RSSI measurement.
        # -------------------------------------------------

        if signal_match:

            rssi = round(
                (signal / 2) - 100,
                1
            )

        elif rssi_match:

            rssi = float(
                rssi_match.group(1)
            )

        else:

            rssi = 0

        # -------------------------------------------------
        # BAND
        # -------------------------------------------------

        band = (
            band_match.group(1).strip()
            if band_match
            else "Unknown"
        )

        # -------------------------------------------------
        # CHANNEL
        # -------------------------------------------------

        channel = (
            channel_match.group(1).strip()
            if channel_match
            else "Unknown"
        )

        # -------------------------------------------------
        # RETURN WIFI INFORMATION
        # -------------------------------------------------

        return {

            "ssid": ssid,

            "signal_percent": signal,

            "rssi": rssi,

            "band": band,

            "channel": channel

        }

    except Exception as error:

        return {

            "error": str(error)

        }


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/index.html")
def index():

    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/dashboard.html")
def dashboard():

    return send_from_directory(
        ".",
        "dashboard.html"
    )


@app.route("/style.css")
def style():

    return send_from_directory(
        ".",
        "style.css"
    )


@app.route("/script.js")
def script():

    return send_from_directory(
        ".",
        "script.js"
    )


# =========================================================
# LAPTOP WIFI API
# =========================================================

@app.route(
    "/api/wifi",
    methods=["GET"]
)
def wifi():

    wifi_info = get_wifi_info()

    return jsonify(
        wifi_info
    )


# =========================================================
# SAVE CURRENT LAPTOP WIFI MEASUREMENT
# =========================================================

# =========================================================
# SAVE CURRENT LAPTOP WIFI MEASUREMENT
# =========================================================

@app.route(
    "/api/measure",
    methods=["POST"]
)
def measure():

    # -----------------------------------------------------
    # Read Wi-Fi information sent by auto_measure.py
    # -----------------------------------------------------

    data = request.get_json(
        silent=True
    ) or {}


    # -----------------------------------------------------
    # Get real laptop Wi-Fi values
    # -----------------------------------------------------

    ssid = str(
        data.get(
            "ssid",
            "Unknown"
        )
    ).strip()


    signal_percent = data.get(
        "signal_percent",
        0
    )


    rssi = data.get(
        "rssi",
        0
    )


    band = str(
        data.get(
            "band",
            "Unknown"
        )
    )


    channel = str(
        data.get(
            "channel",
            "Unknown"
        )
    )


    measurement_point = str(
        data.get(
            "measurement_point",
            "Unknown Point"
        )
    ).strip().upper()


    # -----------------------------------------------------
    # Validate measurement point
    # -----------------------------------------------------

    if not re.fullmatch(
        r"[A-H][1-5]",
        measurement_point
    ):

        return jsonify({

            "status": "error",

            "message":
                "Invalid measurement point. Use A1 to H5."

        }), 400


    # -----------------------------------------------------
    # Detect location from SSID
    # -----------------------------------------------------

    location = WIFI_LOCATIONS.get(
        ssid,
        "Unknown Location"
    )


    # -----------------------------------------------------
    # Complete location
    # Example: Hostel - B5
    # -----------------------------------------------------

    full_location = (
        location
        + " - "
        + measurement_point
    )


    # -----------------------------------------------------
    # Timestamp
    # -----------------------------------------------------

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    # -----------------------------------------------------
    # Save measurement
    # -----------------------------------------------------

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        INSERT INTO measurements
        (
            rssi,
            location,
            ssid,
            signal_percent,
            band,
            channel,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (

        rssi,

        full_location,

        ssid,

        signal_percent,

        band,

        channel,

        timestamp

    ))


    measurement_id = cursor.lastrowid


    connection.commit()

    connection.close()


    # -----------------------------------------------------
    # Return successful result
    # -----------------------------------------------------

    return jsonify({

        "status": "success",

        "message":
            "Wi-Fi measurement stored successfully",

        "data": {

            "id":
                measurement_id,

            "location":
                full_location,

            "measurement_point":
                measurement_point,

            "ssid":
                ssid,

            "rssi":
                rssi,

            "signal_percent":
                signal_percent,

            "band":
                band,

            "channel":
                channel,

            "timestamp":
                timestamp

        }

    })
# =========================================================
# GET ALL DATA
# =========================================================

@app.route("/api/data")
def get_data():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        SELECT *
        FROM measurements
        ORDER BY id ASC
    """)


    rows = cursor.fetchall()

    connection.close()


    data = []


    for row in rows:

        data.append({

            "id":
                row["id"],

            "rssi":
                row["rssi"],

            "location":
                row["location"],

            "ssid":
                row["ssid"],

            "signal_percent":
                row["signal_percent"],

            "band":
                row["band"],

            "channel":
                row["channel"],

            "timestamp":
                row["timestamp"]

        })


    return jsonify(
        data
    )


# =========================================================
# WIFI ANALYSIS
# =========================================================

@app.route("/api/analyze")
def analyze():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        SELECT rssi, location
        FROM measurements
    """)


    rows = cursor.fetchall()

    connection.close()


    if not rows:

        return jsonify({

            "status": "error",

            "message":
                "No measurements available"

        })


    # -----------------------------------------------------
    # RSSI VALUES
    # -----------------------------------------------------

    rssis = [

        row["rssi"]

        for row in rows

    ]


    # -----------------------------------------------------
    # AVERAGE RSSI
    # -----------------------------------------------------

    average_rssi = (

        sum(rssis) /
        len(rssis)

    )


    # -----------------------------------------------------
    # BEST MEASURED LOCATION
    # -----------------------------------------------------

    best = max(

        rows,

        key=lambda row:
            row["rssi"]

    )


    # -----------------------------------------------------
    # WEAK MEASUREMENTS
    # -----------------------------------------------------

    weak_count = sum(

        1

        for rssi in rssis

        if rssi <= -75

    )


    # -----------------------------------------------------
    # RETURN ANALYSIS
    # -----------------------------------------------------

    return jsonify({

        "status":
            "success",

        "average_rssi":
            round(
                average_rssi,
                2
            ),

        "best_location":
            best["location"],

        "best_rssi":
            best["rssi"],

        "total_measurements":
            len(rows),

        "weak_measurements":
            weak_count

    })


# =========================================================
# INITIALIZE DATABASE
# =========================================================

init_database()


# =========================================================
# START FLASK SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
