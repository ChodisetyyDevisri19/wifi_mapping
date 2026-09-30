from flask import Flask, jsonify, request, send_from_directory
import sqlite3
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
# DATABASE CONNECTION
# =========================================================

def get_connection():

    connection = sqlite3.connect(
        DATABASE
    )

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
# WIFI API
# =========================================================
#
# IMPORTANT:
# The Render server cannot directly read your laptop Wi-Fi.
#
# Therefore this endpoint returns the LATEST Wi-Fi
# measurement sent by your laptop through auto_measure.py.
# =========================================================

@app.route("/api/wifi", methods=["GET"])
def wifi():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM measurements
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    connection.close()

    if row is None:

        return jsonify({
            "status": "error",
            "message": "No Wi-Fi measurement available yet"
        })

    return jsonify({

        "status": "success",

        "ssid": row["ssid"],

        "signal_percent":
            row["signal_percent"],

        "rssi":
            row["rssi"],

        "band":
            row["band"],

        "channel":
            row["channel"],

        "location":
            row["location"],

        "timestamp":
            row["timestamp"]

    })


# =========================================================
# LATEST MEASUREMENT API
# =========================================================

@app.route("/api/latest", methods=["GET"])
def latest():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM measurements
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    connection.close()

    if row is None:

        return jsonify({
            "status": "error",
            "message": "No measurements available"
        }), 404

    return jsonify({

        "status": "success",

        "data": {

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

        }

    })


# =========================================================
# RECEIVE WIFI MEASUREMENT FROM LAPTOP
# =========================================================
#
# The laptop runs auto_measure.py.
#
# auto_measure.py reads:
#   SSID
#   Signal %
#   RSSI
#   Band
#   Channel
#
# Then it sends these values to this API.
# =========================================================

@app.route(
    "/api/measure",
    methods=["POST"]
)
def measure():

    # -----------------------------------------------------
    # READ JSON DATA SENT BY LAPTOP
    # -----------------------------------------------------

    data = request.get_json(
        silent=True
    ) or {}


    # -----------------------------------------------------
    # GET WIFI VALUES
    # -----------------------------------------------------

    ssid = data.get(
        "ssid",
        "Unknown"
    )

    signal_percent = data.get(
        "signal_percent",
        0
    )

    rssi = data.get(
        "rssi",
        0
    )

    band = data.get(
        "band",
        "Unknown"
    )

    channel = data.get(
        "channel",
        "Unknown"
    )


    # -----------------------------------------------------
    # GET MEASUREMENT POINT
    # -----------------------------------------------------

    measurement_point = data.get(
        "measurement_point",
        "Unknown Point"
    )

    measurement_point = str(
        measurement_point
    ).strip().upper()


    # -----------------------------------------------------
    # CLEAN WIFI VALUES
    # -----------------------------------------------------

    ssid = str(
        ssid
    ).strip()

    band = str(
        band
    ).strip()

    channel = str(
        channel
    ).strip()


    # -----------------------------------------------------
    # CONVERT NUMERIC VALUES
    # -----------------------------------------------------

    try:

        signal_percent = float(
            signal_percent
        )

    except:

        signal_percent = 0


    try:

        rssi = float(
            rssi
        )

    except:

        rssi = 0


    # -----------------------------------------------------
    # AUTOMATIC LOCATION DETECTION
    # -----------------------------------------------------

    location = WIFI_LOCATIONS.get(
        ssid,
        "Unknown Location"
    )


    # -----------------------------------------------------
    # CREATE COMPLETE LOCATION
    # -----------------------------------------------------
    #
    # Example:
    # Hostel - B3
    #
    # -----------------------------------------------------

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
    # SAVE DATA INTO DATABASE
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
    # RETURN SUCCESS RESPONSE
    # -----------------------------------------------------

    return jsonify({

        "status":
            "success",

        "message":
            "Wi-Fi measurement received and stored",

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
# GET ALL WIFI DATA
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
        SELECT
            rssi,
            location,
            ssid,
            signal_percent,
            band,
            channel,
            timestamp
        FROM measurements
    """)

    rows = cursor.fetchall()

    connection.close()


    # -----------------------------------------------------
    # NO DATA
    # -----------------------------------------------------

    if not rows:

        return jsonify({

            "status":
                "error",

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

        sum(rssis)
        /
        len(rssis)

    )


    # -----------------------------------------------------
    # BEST LOCATION
    # -----------------------------------------------------
    #
    # Higher RSSI is stronger.
    #
    # Example:
    # -50 dBm is stronger than -80 dBm.
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
