from flask import Flask, jsonify, request, send_from_directory
import sqlite3
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
    "ACT-ai_101818820927": "Hostel",

    # Add college Wi-Fi later if required:
    # "YOUR_COLLEGE_WIFI_NAME": "College"
}


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():

    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


# =========================================================
# INITIALIZE DATABASE
# =========================================================

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
# GET LATEST MEASUREMENT
# =========================================================

def get_latest_measurement():

    connection = get_connection()

    row = connection.execute("""
        SELECT
            id,
            rssi,
            location,
            ssid,
            signal_percent,
            band,
            channel,
            timestamp
        FROM measurements
        ORDER BY id DESC
        LIMIT 1
    """).fetchone()

    connection.close()

    return row


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# =========================================================
# INDEX PAGE
# =========================================================

@app.route("/index.html")
def index():

    return send_from_directory(
        ".",
        "index.html"
    )


# =========================================================
# DASHBOARD PAGE
# =========================================================

@app.route("/dashboard.html")
def dashboard():

    return send_from_directory(
        ".",
        "dashboard.html"
    )


# =========================================================
# CSS
# =========================================================

@app.route("/style.css")
def style():

    return send_from_directory(
        ".",
        "style.css"
    )


# =========================================================
# JAVASCRIPT
# =========================================================

@app.route("/script.js")
def script():

    return send_from_directory(
        ".",
        "script.js"
    )


# =========================================================
# WIFI API
# =========================================================
#
# IMPORTANT:
# This does NOT use netsh.
#
# It reads the latest Wi-Fi measurement stored in
# the Render database.
# =========================================================

@app.route("/api/wifi", methods=["GET"])
def wifi():

    row = get_latest_measurement()

    # No measurement has been stored yet
    if row is None:

        return jsonify({

            "status": "success",

            "message": "No measurements available yet",

            "ssid": "No measurement",

            "signal_percent": 0,

            "rssi": None,

            "band": "Unknown",

            "channel": "Unknown",

            "location": "No measurement",

            "timestamp": None

        })


    # Return latest stored measurement
    return jsonify({

        "status": "success",

        "ssid": row["ssid"],

        "signal_percent": row["signal_percent"],

        "rssi": row["rssi"],

        "band": row["band"],

        "channel": row["channel"],

        "location": row["location"],

        "timestamp": row["timestamp"],

        "id": row["id"]

    })


# =========================================================
# SAVE WIFI MEASUREMENT
# =========================================================
#
# auto_measure.py sends the laptop Wi-Fi information here.
# =========================================================

@app.route("/api/measure", methods=["POST"])
def measure():

    data = request.get_json(
        silent=True
    ) or {}


    # -----------------------------------------------------
    # SSID
    # -----------------------------------------------------

    ssid = str(
        data.get(
            "ssid",
            "Unknown"
        )
    ).strip()

    if not ssid:

        ssid = "Unknown"


    # -----------------------------------------------------
    # MEASUREMENT POINT
    # -----------------------------------------------------

    measurement_point = str(
        data.get(
            "measurement_point",
            "Unknown Point"
        )
    ).strip().upper()


    # -----------------------------------------------------
    # VALIDATE GRID POINT
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
    # SIGNAL AND RSSI
    # -----------------------------------------------------

    try:

        signal_percent = float(
            data.get(
                "signal_percent",
                0
            )
        )

        rssi = float(
            data.get(
                "rssi",
                0
            )
        )

    except (TypeError, ValueError):

        return jsonify({

            "status": "error",

            "message":
                "signal_percent and rssi must be numbers."

        }), 400


    # -----------------------------------------------------
    # KEEP SIGNAL BETWEEN 0 AND 100
    # -----------------------------------------------------

    signal_percent = max(
        0,
        min(
            100,
            signal_percent
        )
    )


    # -----------------------------------------------------
    # BAND
    # -----------------------------------------------------

    band = str(
        data.get(
            "band",
            "Unknown"
        )
    ).strip()

    if not band:

        band = "Unknown"


    # -----------------------------------------------------
    # CHANNEL
    # -----------------------------------------------------

    channel = str(
        data.get(
            "channel",
            "Unknown"
        )
    ).strip()

    if not channel:

        channel = "Unknown"


    # -----------------------------------------------------
    # LOCATION
    # -----------------------------------------------------

    location = WIFI_LOCATIONS.get(
        ssid,
        "Unknown Location"
    )


    # Example:
    # Hostel - B5

    full_location = (
        location
        + " - "
        + measurement_point
    )


    # -----------------------------------------------------
    # TIMESTAMP
    # -----------------------------------------------------

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    # -----------------------------------------------------
    # SAVE TO DATABASE
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
    # RETURN SUCCESS
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
# GET ALL MEASUREMENTS
# =========================================================

@app.route("/api/data", methods=["GET"])
def get_data():

    connection = get_connection()


    rows = connection.execute("""
        SELECT
            id,
            rssi,
            location,
            ssid,
            signal_percent,
            band,
            channel,
            timestamp
        FROM measurements
        ORDER BY id ASC
    """).fetchall()


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


    return jsonify(data)


# =========================================================
# WIFI ANALYSIS
# =========================================================

@app.route("/api/analyze", methods=["GET"])
def analyze():

    connection = get_connection()


    rows = connection.execute("""
        SELECT
            rssi,
            location
        FROM measurements
    """).fetchall()


    connection.close()


    # -----------------------------------------------------
    # NO DATA
    # -----------------------------------------------------

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

        float(row["rssi"])

        for row in rows

    ]


    # -----------------------------------------------------
    # AVERAGE RSSI
    # -----------------------------------------------------

    average_rssi = (

        sum(rssis)
        /
        len(rssis)

    )


    # -----------------------------------------------------
    # BEST LOCATION
    # -----------------------------------------------------

    best = max(

        rows,

        key=lambda row:
            float(row["rssi"])

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
# START FLASK
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
