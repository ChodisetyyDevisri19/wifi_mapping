import urllib.request
import urllib.error
import json
import time
import re


# =========================================================
# FLASK SERVER
# =========================================================

API_BASE = "http://127.0.0.1:5000"


# =========================================================
# WIFI NAME -> LOCATION
# =========================================================

WIFI_LOCATIONS = {

    # Your current Hostel Wi-Fi
    "ACT-ai_101818820927": "Hostel",

    # Add your college Wi-Fi SSID here later
    # Example:
    # "IARE_WIFI_NAME": "College"

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
# GET REAL WIFI INFORMATION
# =========================================================

def get_wifi():

    try:

        response = urllib.request.urlopen(
            API_BASE + "/api/wifi",
            timeout=5
        )

        data = response.read().decode()

        wifi = json.loads(data)

        return wifi

    except Exception as error:

        print()
        print("Could not get Wi-Fi information.")
        print("Error:", error)

        return None


# =========================================================
# SAVE ONE MEASUREMENT
# =========================================================

def save_measurement(
    measurement_point
):

    try:

        # -------------------------------------------------
        # Get current real Wi-Fi information
        # -------------------------------------------------

        wifi = get_wifi()

        if wifi is None:

            return False


        # -------------------------------------------------
        # Check for Wi-Fi error
        # -------------------------------------------------

        if "error" in wifi:

            print()
            print(
                "Wi-Fi error:",
                wifi["error"]
            )

            return False


        # -------------------------------------------------
        # Read current Wi-Fi data
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
        # Automatically determine location
        # -------------------------------------------------

        location = WIFI_LOCATIONS.get(
            ssid,
            "Unknown Location"
        )


        # -------------------------------------------------
        # Display measurement
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
        # Send only grid point to Flask
        #
        # Flask automatically gets the REAL Wi-Fi data
        # -------------------------------------------------

        measurement = {

            "measurement_point":
                measurement_point

        }


        data = json.dumps(
            measurement
        ).encode()


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
        # Send measurement
        # -------------------------------------------------

        response = urllib.request.urlopen(
            request,
            timeout=5
        )


        result = json.loads(
            response.read().decode()
        )


        # -------------------------------------------------
        # Check result
        # -------------------------------------------------

        if result.get("status") == "success":

            saved_data = result.get(
                "data",
                {}
            )

            print()
            print("✓ MEASUREMENT SAVED SUCCESSFULLY")
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
                "SSID           :",
                saved_data.get("ssid")
            )

            print(
                "Time           :",
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
            "Server error:",
            error.code
        )

        try:

            print(
                error.read().decode()
            )

        except:

            pass

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
print("       AI-BASED WI-FI SIGNAL MAPPING")
print("       REAL MEASUREMENT COLLECTION")
print("=" * 65)

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
print("Type Q when you have finished collecting measurements.")
print()


# =========================================================
# CHECK FLASK SERVER
# =========================================================

print("Checking Flask server...")

wifi = get_wifi()

if wifi is None:

    print()
    print("ERROR: Flask server is not responding.")
    print()
    print("Make sure this is running in another CMD:")
    print()
    print("    python app.py")
    print()

    input("Press Enter to exit...")

    raise SystemExit


print("Flask server connected.")

print()


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

current_location = WIFI_LOCATIONS.get(
    current_ssid,
    "Unknown Location"
)


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

print("=" * 65)

print()


# =========================================================
# COLLECT MEASUREMENTS
# =========================================================

collected_points = set()


while True:

    print()
    print("-" * 65)

    print(
        "Already collected:",
        len(collected_points),
        "grid point(s)"
    )

    if collected_points:

        print(
            "Points:",
            ", ".join(
                sorted(collected_points)
            )
        )

    print("-" * 65)

    print()

    # -----------------------------------------------------
    # Ask for next point
    # -----------------------------------------------------

    point = input(
        "Enter current grid point (example A1, B3, C5) or Q to finish: "
    ).strip().upper()


    # -----------------------------------------------------
    # Quit
    # -----------------------------------------------------

    if point == "Q":

        print()
        print("=" * 65)
        print("MEASUREMENT COLLECTION FINISHED")
        print("=" * 65)

        print()
        print(
            "Total grid points collected:",
            len(collected_points)
        )

        if collected_points:

            print()
            print(
                "Collected points:"
            )

            print(
                ", ".join(
                    sorted(collected_points)
                )
            )

        print()
        print(
            "Open your dashboard:"
        )

        print(
            "http://127.0.0.1:5000/dashboard.html"
        )

        print()

        break


    # -----------------------------------------------------
    # Validate grid point
    # -----------------------------------------------------

    if not valid_grid_point(point):

        print()
        print(
            "Invalid grid point."
        )

        print(
            "Use A1 to H5."
        )

        print(
            "Examples: A1, B3, C5, H5"
        )

        continue


    # -----------------------------------------------------
    # Prevent accidental duplicate
    # -----------------------------------------------------

    if point in collected_points:

        print()
        print(
            "You already collected",
            point
        )

        print(
            "Move to another grid point."
        )

        print(
            "If you intentionally want another"
        )

        print(
            "measurement at the same point,"
        )

        print(
            "you can still continue by entering"
        )

        print(
            "the point again after confirmation."
        )

        print()

        confirm = input(
            "Collect another measurement at "
            + point
            + "? (y/n): "
        ).strip().lower()

        if confirm != "y":

            continue


    # -----------------------------------------------------
    # Ask user to physically move
    # -----------------------------------------------------

    print()
    print("=" * 65)

    print(
        "CURRENT GRID POINT:",
        point
    )

    print("=" * 65)

    print()

    print(
        "Make sure your laptop is physically"
    )

    print(
        "at grid point",
        point
    )

    print()

    input(
        "Press ENTER when you are ready to measure..."
    )


    # -----------------------------------------------------
    # Take measurement
    # -----------------------------------------------------

    print()
    print(
        "Collecting REAL Wi-Fi measurement..."
    )

    time.sleep(1)


    success = save_measurement(
        point
    )


    # -----------------------------------------------------
    # Mark point as collected
    # -----------------------------------------------------

    if success:

        collected_points.add(
            point
        )

        print()
        print(
            "✓",
            point,
            "has been added to the Wi-Fi map."
        )

    else:

        print()
        print(
            "✗ Measurement was not saved."
        )

        print(
            "Please try this point again."
        )


    # -----------------------------------------------------
    # Small delay
    # -----------------------------------------------------

    time.sleep(1)


# =========================================================
# END
# =========================================================

print()
print("Program stopped.")