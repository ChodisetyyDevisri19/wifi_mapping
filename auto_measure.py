import urllib.request
import urllib.error
import json
import time
import re
import subprocess


# =========================================================
# RENDER SERVER
# =========================================================

API_BASE = "https://wifi-mapping.onrender.com"


# =========================================================
# WIFI NAME -> LOCATION
# =========================================================

WIFI_LOCATIONS = {

    # Your current Hostel Wi-Fi
    "ACT-ai_101818820927": "Hostel",

    # Add your college Wi-Fi later:
    # "YOUR_COLLEGE_WIFI": "College"

}


# =========================================================
# GRID POINT VALIDATION
# =========================================================

def valid_grid_point(point):

    pattern = r"^[A-Ha-h][1-5]$"

    return re.match(
        pattern,
        point
    ) is not None


# =========================================================
# GET REAL WIFI INFORMATION FROM THIS LAPTOP
# =========================================================

def get_local_wifi():

    try:

        # -------------------------------------------------
        # Windows Wi-Fi command
        # -------------------------------------------------

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
        # SIGNAL %
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
        # EXTRACT SSID
        # -------------------------------------------------

        ssid = (

            ssid_match.group(1).strip()

            if ssid_match

            else "Unknown"

        )


        # -------------------------------------------------
        # EXTRACT SIGNAL
        # -------------------------------------------------

        signal = (

            int(signal_match.group(1))

            if signal_match

            else 0

        )


        # -------------------------------------------------
        # RSSI
        # -------------------------------------------------

        # Windows Signal % is used to estimate RSSI.
        #
        # Approximation:
        #
        # RSSI ≈ (Signal % / 2) - 100
        #
        # Example:
        # 80% -> -60 dBm
        # 60% -> -70 dBm
        # 40% -> -80 dBm

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
        # RETURN WIFI DATA
        # -------------------------------------------------

        return {

            "ssid":
                ssid,

            "signal_percent":
                signal,

            "rssi":
                rssi,

            "band":
                band,

            "channel":
                channel

        }


    except Exception as error:

        print()

        print(
            "Could not read laptop Wi-Fi."
        )

        print(
            "Error:",
            error
        )

        return None


# =========================================================
# SEND ONE MEASUREMENT TO RENDER
# =========================================================

def save_measurement(
    measurement_point
):

    try:

        # -------------------------------------------------
        # READ REAL WIFI FROM THIS LAPTOP
        # -------------------------------------------------

        wifi = get_local_wifi()


        if wifi is None:

            return False


        # -------------------------------------------------
        # GET WIFI VALUES
        # -------------------------------------------------

        ssid = wifi.get(
            "ssid",
            "Unknown"
        )

        signal = wifi.get(
            "signal_percent",
            0
        )

        rssi = wifi.get(
            "rssi",
            0
        )

        band = wifi.get(
            "band",
            "Unknown"
        )

        channel = wifi.get(
            "channel",
            "Unknown"
        )


        # -------------------------------------------------
        # DETECT LOCATION
        # -------------------------------------------------

        location = WIFI_LOCATIONS.get(

            ssid,

            "Unknown Location"

        )


        # -------------------------------------------------
        # DISPLAY CURRENT WIFI
        # -------------------------------------------------

        print()

        print("=" * 65)

        print(
            "SSID              :",
            ssid
        )

        print(
            "Detected Location :",
            location
        )

        print(
            "Grid Point        :",
            measurement_point
        )

        print(
            "RSSI              :",
            rssi,
            "dBm"
        )

        print(
            "Signal            :",
            signal,
            "%"
        )

        print(
            "Band              :",
            band
        )

        print(
            "Channel           :",
            channel
        )

        print("=" * 65)


        # -------------------------------------------------
        # CREATE DATA TO SEND
        # -------------------------------------------------

        measurement = {

            "measurement_point":
                measurement_point,

            "ssid":
                ssid,

            "signal_percent":
                signal,

            "rssi":
                rssi,

            "band":
                band,

            "channel":
                channel

        }


        # -------------------------------------------------
        # CONVERT TO JSON
        # -------------------------------------------------

        data = json.dumps(

            measurement

        ).encode()


        # -------------------------------------------------
        # CREATE POST REQUEST
        # -------------------------------------------------

        request = urllib.request.Request(

            API_BASE + "/api/measure",

            data=data,

            headers={

                "Content-Type":
                    "application/json"

            },

            method="POST"

        )


        # -------------------------------------------------
        # SEND TO RENDER
        # -------------------------------------------------

        response = urllib.request.urlopen(

            request,

            timeout=15

        )


        # -------------------------------------------------
        # READ SERVER RESPONSE
        # -------------------------------------------------

        result = json.loads(

            response.read().decode()

        )


        # -------------------------------------------------
        # CHECK RESULT
        # -------------------------------------------------

        if result.get("status") == "success":

            saved_data = result.get(

                "data",

                {}

            )


            print()

            print(
                "✓ MEASUREMENT SAVED SUCCESSFULLY"
            )

            print()

            print(
                "Measurement ID :",
                saved_data.get("id")
            )

            print(
                "Location       :",
                saved_data.get("location")
            )

            print(
                "SSID           :",
                saved_data.get("ssid")
            )

            print(
                "RSSI           :",
                saved_data.get("rssi"),
                "dBm"
            )

            print(
                "Signal         :",
                saved_data.get("signal_percent"),
                "%"
            )

            print(
                "Band           :",
                saved_data.get("band")
            )

            print(
                "Channel        :",
                saved_data.get("channel")
            )

            print(
                "Time            :",
                saved_data.get("timestamp")
            )

            print()

            return True


        else:

            print()

            print(
                "Server did not save the measurement."
            )

            print(
                "Server response:",
                result
            )

            return False


    except urllib.error.HTTPError as error:

        print()

        print(
            "Server HTTP error:",
            error.code
        )

        try:

            print(
                error.read().decode()
            )

        except:

            pass

        return False


    except urllib.error.URLError as error:

        print()

        print(
            "Could not connect to Render server."
        )

        print(
            "Error:",
            error
        )

        return False


    except Exception as error:

        print()

        print(
            "Measurement error:",
            error
        )

        return False


# =========================================================
# MAIN PROGRAM
# =========================================================

print()

print("=" * 65)

print(
    "       AI-BASED WI-FI SIGNAL MAPPING"
)

print(
    "       REAL MEASUREMENT COLLECTION"
)

print("=" * 65)

print()

print(
    "Connected server:"
)

print(
    API_BASE
)

print()

print("Grid area:")

print("A1 - A5")
print("B1 - B5")
print("C1 - C5")
print("D1 - D5")
print("E1 - E5")
print("F1 - F5")
print("G1 - G5")
print("H1 - H5")

print()

print(
    "Type Q when you have finished collecting measurements."
)

print()


# =========================================================
# CHECK LAPTOP WIFI
# =========================================================

print(
    "Checking your laptop Wi-Fi..."
)

wifi = get_local_wifi()


if wifi is None:

    print()

    print(
        "ERROR: Could not read laptop Wi-Fi."
    )

    print()

    input(
        "Press Enter to exit..."
    )

    raise SystemExit


# =========================================================
# SHOW CURRENT WIFI
# =========================================================

current_ssid = wifi.get(

    "ssid",

    "Unknown"

)

current_signal = wifi.get(

    "signal_percent",

    0

)

current_rssi = wifi.get(

    "rssi",

    0

)

current_band = wifi.get(

    "band",

    "Unknown"

)

current_channel = wifi.get(

    "channel",

    "Unknown"

)

current_location = WIFI_LOCATIONS.get(

    current_ssid,

    "Unknown Location"

)


print()

print("=" * 65)

print(
    "Current Wi-Fi       :",
    current_ssid
)

print(
    "Detected environment:",
    current_location
)

print(
    "Current signal      :",
    current_signal,
    "%"
)

print(
    "Current RSSI        :",
    current_rssi,
    "dBm"
)

print(
    "Current band        :",
    current_band
)

print(
    "Current channel     :",
    current_channel
)

print("=" * 65)

print()


# =========================================================
# MEASUREMENT LOOP
# =========================================================

while True:

    print()

    measurement_point = input(

        "Enter measurement point (A1-H5) or Q to quit: "

    ).strip()


    # -----------------------------------------------------
    # QUIT
    # -----------------------------------------------------

    if measurement_point.upper() == "Q":

        print()

        print(
            "Measurement collection finished."
        )

        print()

        print(
            "Your data has been sent to:"
        )

        print(
            API_BASE
        )

        print()

        break


    # -----------------------------------------------------
    # VALIDATE GRID POINT
    # -----------------------------------------------------

    if not valid_grid_point(
        measurement_point
    ):

        print()

        print(
            "Invalid grid point."
        )

        print(
            "Use A1 to H5."
        )

        print()

        continue


    # -----------------------------------------------------
    # CONVERT TO UPPERCASE
    # -----------------------------------------------------

    measurement_point = (

        measurement_point.upper()

    )


    # -----------------------------------------------------
    # SAVE MEASUREMENT
    # -----------------------------------------------------

    success = save_measurement(

        measurement_point

    )


    # -----------------------------------------------------
    # WAIT BEFORE NEXT MEASUREMENT
    # -----------------------------------------------------

    if success:

        print()

        print(
            "Moving to the next measurement point..."
        )

        print()

        time.sleep(2)
