/* =========================================================
   AI-BASED WI-FI SIGNAL MAPPING SYSTEM
   COMPLETE REAL-TIME DASHBOARD SCRIPT
========================================================= */

const API_BASE = "https://wifi-mapping.onrender.com";

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeLogin();
    initializeDashboard();

});


/* =========================================================
   LOGIN
========================================================= */

function initializeLogin() {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    const passwordInput =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");

    const loginError =
        document.getElementById("loginError");


    if (togglePassword && passwordInput) {

        togglePassword.addEventListener(
            "click",
            function () {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword ? "text" : "password";

                togglePassword.textContent =
                    isPassword ? "Hide" : "Show";

            }
        );

    }


    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();

            const password =
                passwordInput.value.trim();


            const validUsername = "demo";
            const validPassword = "demo123";


            if (
                username === validUsername &&
                password === validPassword
            ) {

                sessionStorage.setItem(
                    "wifiDemoLoggedIn",
                    "true"
                );

                sessionStorage.setItem(
                    "wifiDemoUsername",
                    username
                );

                window.location.href =
                    "dashboard.html";

            } else {

                if (loginError) {

                    loginError.hidden = false;

                    loginError.textContent =
                        "Invalid login. Use username demo and password demo123.";

                }

                passwordInput.value = "";
                passwordInput.focus();

            }

        }
    );

}


/* =========================================================
   DASHBOARD INITIALIZATION
========================================================= */

function initializeDashboard() {

    const dashboardPage =
        document.querySelector(
            "[data-page='dashboard']"
        );

    if (!dashboardPage) {
        return;
    }


    const isLoggedIn =
        sessionStorage.getItem(
            "wifiDemoLoggedIn"
        );


    if (isLoggedIn !== "true") {

        window.location.href =
            "index.html";

        return;
    }


    initializeLogout();

    initializeMobileMenu();

    initializeNavigation();

    initializeHeatMap();

    initializeRSSIChart();

    initializeDemoButtons();

    loadWiFiData();

    updateLocation();

    loadRecentMeasurements();

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        function () {

            sessionStorage.removeItem(
                "wifiDemoLoggedIn"
            );

            sessionStorage.removeItem(
                "wifiDemoUsername"
            );

            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const mobileMenuButton =
        document.getElementById(
            "mobileMenuButton"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        !mobileMenuButton ||
        !sidebar
    ) {
        return;
    }


    mobileMenuButton.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(function (item) {

            item.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        });

}


/* =========================================================
   SIGNAL CLASS
========================================================= */

function getSignalClass(rssi) {

    if (rssi >= -59) {
        return "excellent-color";
    }

    if (rssi >= -66) {
        return "good-color";
    }

    if (rssi >= -74) {
        return "fair-color";
    }

    if (rssi >= -79) {
        return "poor-color";
    }

    return "weak-color";

}


/* =========================================================
   GET GRID POINT
========================================================= */

function getGridPoint(location) {

    const text =
        String(location || "");

    const match =
        text.match(
            /\b([A-H])\s*[- ]?\s*([1-5])\b/i
        );


    if (!match) {
        return null;
    }


    return (
        match[1].toUpperCase() +
        match[2]
    );

}


/* =========================================================
   HEAT MAP
========================================================= */

async function initializeHeatMap() {

    const heatmapGrid =
        document.getElementById(
            "heatmapGrid"
        );


    if (!heatmapGrid) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE + "/api/data"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load measurements"
            );

        }


        const measurements =
            await response.json();


        if (
            !Array.isArray(measurements)
        ) {
            return;
        }


        /* =========================================
           UPDATE AI
        ========================================= */

        updateAIRecommendation(
            measurements
        );


        /* =========================================
           LATEST MEASUREMENT
        ========================================= */

        const latestMeasurement =
            measurements.length > 0
                ? measurements[
                    measurements.length - 1
                ]
                : null;


        /* =========================================
           CURRENT LOCATION TEXT
        ========================================= */

        const locationMarker =
            document.querySelector(
                ".heatmap-location-marker"
            );


        if (
            locationMarker &&
            latestMeasurement
        ) {

            locationMarker.innerHTML =
                '<span class="location-marker-dot"></span>' +
                " Current measurement: " +
                (
                    latestMeasurement.location ||
                    "Unknown Location"
                );

        }


        /* =========================================
           GROUP READINGS BY GRID POINT
           
           IMPORTANT:
           We calculate the average RSSI
           for every grid point.
           
           Example:
           
           A1 = -50, -51, -49
           
           Average:
           
           A1 = -50 dBm
           
           D3 = -55, -56, -57
           
           Average:
           
           D3 = -56 dBm
           
           The heat map and AI use the SAME
           averaged values.
        ========================================= */

        const gridPoints =
            new Map();


        measurements.forEach(
            function (measurement) {

                const point =
                    getGridPoint(
                        measurement.location
                    );


                if (!point) {
                    return;
                }


                const rssi =
                    Number(
                        measurement.rssi
                    );


                if (isNaN(rssi)) {
                    return;
                }


                if (!gridPoints.has(point)) {

                    gridPoints.set(
                        point,
                        {
                            readings: [],
                            latestMeasurement: null,
                            location:
                                measurement.location
                        }
                    );

                }


                const data =
                    gridPoints.get(point);


                data.readings.push(rssi);

                data.latestMeasurement =
                    measurement;

                data.location =
                    measurement.location;

            }
        );


        /* =========================================
           CREATE GRID
           
           8 columns:
           A B C D E F G H
           
           5 rows:
           1 2 3 4 5
        ========================================= */

        heatmapGrid.innerHTML = "";


        const columns =
            [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H"
            ];


        for (
            let row = 1;
            row <= 5;
            row++
        ) {

            for (
                let column = 0;
                column < columns.length;
                column++
            ) {

                const coordinate =
                    columns[column] +
                    row;


                const cell =
                    document.createElement(
                        "div"
                    );


                cell.className =
                    "heat-cell";


                const data =
                    gridPoints.get(
                        coordinate
                    );


                /* =================================
                   NO DATA
                ================================= */

                if (
                    !data ||
                    data.readings.length === 0
                ) {

                    cell.textContent = "—";

                    cell.title =
                        coordinate +
                        " | No measurement";

                }


                /* =================================
                   DATA AVAILABLE
                ================================= */

                else {

                    const total =
                        data.readings.reduce(
                            function (
                                sum,
                                value
                            ) {

                                return sum + value;

                            },
                            0
                        );


                    const average =
                        total /
                        data.readings.length;


                    cell.className =
                        "heat-cell " +
                        getSignalClass(
                            average
                        );


                    cell.textContent =
                        Math.round(
                            average
                        );


                    cell.title =
                        coordinate +
                        " | Average RSSI: " +
                        average.toFixed(1) +
                        " dBm | Readings: " +
                        data.readings.length;


                    /* =================================
                       HIGHLIGHT CURRENT LOCATION
                    ================================= */

                    if (
                        latestMeasurement &&
                        data.latestMeasurement ===
                        latestMeasurement
                    ) {

                        cell.classList.add(
                            "current-cell"
                        );

                    }

                }


                heatmapGrid.appendChild(
                    cell
                );

            }

        }


        console.log(
            "Heat map updated.",
            "Total readings:",
            measurements.length,
            "Grid points:",
            gridPoints.size
        );


    } catch (error) {

        console.error(
            "Heat map error:",
            error
        );

    }

}


/* =========================================================
   AI RECOMMENDATION
========================================================= */

function updateAIRecommendation(measurements) {

    /*
     * =====================================================
     * AI-BASED ROUTER PLACEMENT ANALYSIS
     * =====================================================
     *
     * This function ONLY changes the AI calculation.
     *
     * Dashboard:
     *      NOT changed
     *
     * Heat map:
     *      NOT changed
     *
     * RSSI chart:
     *      NOT changed
     *
     * Database:
     *      NOT changed
     *
     * The algorithm evaluates:
     *
     * 1. Average RSSI
     * 2. Coverage around each candidate point
     * 3. Weak-zone penalty
     * 4. Distance from measured points
     * 5. Number of measurements
     *
     * The purpose is to find a BALANCED router
     * placement instead of simply choosing the
     * strongest single RSSI point.
     */


    /* =====================================================
       1. CHECK MEASUREMENTS
    ===================================================== */

    if (
        !Array.isArray(measurements) ||
        measurements.length === 0
    ) {

        console.log(
            "AI: No measurements available."
        );

        return;
    }


    /* =====================================================
       2. CREATE CLEAN MEASUREMENT DATA
    ===================================================== */

    const validMeasurements =
        measurements
            .filter(function (measurement) {

                return (
                    measurement &&
                    measurement.rssi !== undefined &&
                    measurement.rssi !== null &&
                    !isNaN(
                        Number(measurement.rssi)
                    ) &&
                    getGridPoint(
                        measurement.location
                    )
                );

            })
            .map(function (measurement) {

                return {

                    rssi:
                        Number(
                            measurement.rssi
                        ),

                    location:
                        String(
                            measurement.location ||
                            "Unknown Location"
                        ),

                    point:
                        getGridPoint(
                            measurement.location
                        )

                };

            });


    if (
        validMeasurements.length === 0
    ) {

        console.log(
            "AI: No valid measurements."
        );

        return;
    }


    /* =====================================================
       3. GROUP MEASUREMENTS BY GRID POINT
    ===================================================== */

    const gridData = {};


    validMeasurements.forEach(
        function (measurement) {

            const point =
                measurement.point;


            if (!gridData[point]) {

                gridData[point] = {

                    point:
                        point,

                    location:
                        measurement.location,

                    readings:
                        []

                };

            }


            gridData[point]
                .readings
                .push(
                    measurement.rssi
                );

        }
    );


    /* =====================================================
       4. CALCULATE AVERAGE RSSI FOR EACH GRID POINT
    ===================================================== */

    const points = [];


    Object.keys(gridData)
        .forEach(
            function (pointName) {

                const data =
                    gridData[pointName];


                if (
                    data.readings.length === 0
                ) {
                    return;
                }


                const total =
                    data.readings.reduce(
                        function (
                            sum,
                            value
                        ) {

                            return (
                                sum + value
                            );

                        },
                        0
                    );


                const averageRSSI =
                    total /
                    data.readings.length;


                const strongestRSSI =
                    Math.max(
                        ...data.readings
                    );


                const weakestRSSI =
                    Math.min(
                        ...data.readings
                    );


                /* -----------------------------------------
                   SIGNAL QUALITY
                ----------------------------------------- */

                let excellent = 0;
                let good = 0;
                let fair = 0;
                let poor = 0;
                let weak = 0;


                data.readings.forEach(
                    function (rssi) {

                        if (
                            rssi >= -59
                        ) {

                            excellent++;

                        }
                        else if (
                            rssi >= -66
                        ) {

                            good++;

                        }
                        else if (
                            rssi >= -74
                        ) {

                            fair++;

                        }
                        else if (
                            rssi >= -79
                        ) {

                            poor++;

                        }
                        else {

                            weak++;

                        }

                    }
                );


                const totalReadings =
                    data.readings.length;


                const acceptable =
                    excellent +
                    good +
                    fair;


                const coverage =
                    (
                        acceptable /
                        totalReadings
                    ) * 100;


                points.push({

                    point:
                        pointName,

                    location:
                        data.location,

                    averageRSSI:
                        averageRSSI,

                    strongestRSSI:
                        strongestRSSI,

                    weakestRSSI:
                        weakestRSSI,

                    readings:
                        totalReadings,

                    excellent:
                        excellent,

                    good:
                        good,

                    fair:
                        fair,

                    poor:
                        poor,

                    weak:
                        weak,

                    coverage:
                        coverage

                });

            }
        );


    if (
        points.length === 0
    ) {

        return;
    }


    /* =====================================================
       5. CONVERT GRID POINT TO X/Y COORDINATES
    ===================================================== */

    function getCoordinates(point) {

        const match =
            point.match(
                /^([A-H])([1-5])$/
            );


        if (!match) {

            return null;

        }


        return {

            x:
                match[1].charCodeAt(0) -
                "A".charCodeAt(0),

            y:
                Number(
                    match[2]
                ) - 1

        };

    }


    /* =====================================================
       6. CALCULATE AI SCORE FOR EVERY CANDIDATE
    ===================================================== */

    points.forEach(
        function (candidate) {

            const candidateCoordinates =
                getCoordinates(
                    candidate.point
                );


            if (!candidateCoordinates) {

                candidate.aiScore =
                    -Infinity;

                return;

            }


            let weightedRSSI = 0;

            let totalWeight = 0;

            let nearbyCoverage = 0;

            let nearbyWeight = 0;

            let weakPenalty = 0;


            /* ---------------------------------------------
               COMPARE CANDIDATE WITH EVERY MEASURED POINT
            --------------------------------------------- */

            points.forEach(
                function (target) {

                    const targetCoordinates =
                        getCoordinates(
                            target.point
                        );


                    if (
                        !targetCoordinates
                    ) {

                        return;

                    }


                    const dx =
                        candidateCoordinates.x -
                        targetCoordinates.x;


                    const dy =
                        candidateCoordinates.y -
                        targetCoordinates.y;


                    const distance =
                        Math.sqrt(
                            (
                                dx * dx
                            ) +
                            (
                                dy * dy
                            )
                        );


                    /*
                     * Nearby points receive greater
                     * importance.
                     *
                     * Same point:
                     * distance = 0
                     *
                     * Nearby:
                     * distance = 1
                     *
                     * Farther:
                     * lower weight
                     */

                    const weight =
                        1 /
                        (
                            1 +
                            distance
                        );


                    weightedRSSI +=
                        target.averageRSSI *
                        weight;


                    totalWeight +=
                        weight;


                    nearbyCoverage +=
                        target.coverage *
                        weight;


                    nearbyWeight +=
                        weight;


                    /*
                     * Penalize weak areas.
                     *
                     * Very weak measurements have
                     * greater penalty.
                     */

                    if (
                        target.averageRSSI <= -80
                    ) {

                        weakPenalty +=
                            25 * weight;

                    }
                    else if (
                        target.averageRSSI <= -74
                    ) {

                        weakPenalty +=
                            10 * weight;

                    }

                }
            );


            /* ---------------------------------------------
               SPATIAL RSSI
            --------------------------------------------- */

            const spatialRSSI =
                totalWeight > 0
                    ? weightedRSSI /
                      totalWeight
                    : candidate.averageRSSI;


            /* ---------------------------------------------
               SPATIAL COVERAGE
            --------------------------------------------- */

            const spatialCoverage =
                nearbyWeight > 0
                    ? nearbyCoverage /
                      nearbyWeight
                    : candidate.coverage;


            /* ---------------------------------------------
               RSSI SCORE
            --------------------------------------------- */

            let rssiScore =
                (
                    (
                        spatialRSSI + 90
                    ) /
                    40
                ) * 100;


            rssiScore =
                Math.max(
                    0,
                    Math.min(
                        100,
                        rssiScore
                    )
                );


            /* ---------------------------------------------
               COVERAGE SCORE
            --------------------------------------------- */

            const coverageScore =
                Math.max(
                    0,
                    Math.min(
                        100,
                        spatialCoverage
                    )
                );


            /* ---------------------------------------------
               CONSISTENCY SCORE
            --------------------------------------------- */

            let consistencyScore =
                100;


            const variation =
                candidate.strongestRSSI -
                candidate.weakestRSSI;


            if (
                variation > 15
            ) {

                consistencyScore = 70;

            }
            else if (
                variation > 10
            ) {

                consistencyScore = 80;

            }
            else if (
                variation > 5
            ) {

                consistencyScore = 90;

            }


            /* ---------------------------------------------
               MEASUREMENT RELIABILITY
            --------------------------------------------- */

            let reliabilityScore =
                Math.min(
                    100,
                    candidate.readings * 20
                );


            /*
             * If only one reading exists,
             * reliability is intentionally low.
             */

            if (
                candidate.readings === 1
            ) {

                reliabilityScore = 40;

            }


            /* ---------------------------------------------
               FINAL AI SCORE
            ---------------------------------------------

               RSSI             = 40%
               Coverage         = 35%
               Consistency      = 10%
               Reliability      = 15%

               Weak areas are
               separately penalized.
            */

            const rawScore =

                (
                    rssiScore * 0.40
                ) +

                (
                    coverageScore * 0.35
                ) +

                (
                    consistencyScore * 0.10
                ) +

                (
                    reliabilityScore * 0.15
                );


            candidate.aiScore =
                rawScore -
                weakPenalty;


            candidate.spatialRSSI =
                spatialRSSI;


            candidate.spatialCoverage =
                spatialCoverage;


            candidate.weakPenalty =
                weakPenalty;

        }
    );


    /* =====================================================
       7. FIND BEST PLACEMENT
    ===================================================== */

    let bestPoint =
        points[0];


    points.forEach(
        function (candidate) {

            if (
                candidate.aiScore >
                bestPoint.aiScore
            ) {

                bestPoint =
                    candidate;

            }

        }
    );


    /* =====================================================
       8. OVERALL NETWORK RSSI
    ===================================================== */

    let overallTotal = 0;


    points.forEach(
        function (point) {

            overallTotal +=
                point.averageRSSI;

        }
    );


    const overallAverage =
        overallTotal /
        points.length;


    /* =====================================================
       9. WEAK ZONES
    ===================================================== */

    const weakPoints =
        points.filter(
            function (point) {

                return (
                    point.averageRSSI <= -80
                );

            }
        );


    const weakZones =
        weakPoints.length;


    /* =====================================================
       10. OVERALL COVERAGE
    ===================================================== */

    const acceptablePoints =
        points.filter(
            function (point) {

                return (
                    point.averageRSSI >= -74
                );

            }
        ).length;


    const coveragePercentage =
        Math.round(

            (
                acceptablePoints /
                points.length
            ) * 100

        );


    /* =====================================================
       11. RSSI DIFFERENCE
    ===================================================== */

    const improvement =
        Math.max(

            0,

            Math.round(

                bestPoint.averageRSSI -
                overallAverage

            )

        );


    /* =====================================================
       12. UPDATE EXISTING COVERAGE SYSTEM
    ===================================================== */

    updateCoverageDistribution(
        points
    );


    /* =====================================================
       13. UPDATE YOUR EXISTING DASHBOARD
    =====================================================

       IMPORTANT:

       This uses the SAME existing function
       already present in your script.

       Therefore your current dashboard design
       does not need to change.
    */

    updateAIInterface(

        bestPoint.location,

        bestPoint.averageRSSI,

        overallAverage,

        points.length,

        weakZones,

        coveragePercentage,

        improvement

    );


    /* =====================================================
       14. AI EXPLANATION FOR CONSOLE
    ===================================================== */

    console.log(
        "=========================================="
    );

    console.log(
        "AI ROUTER PLACEMENT ANALYSIS"
    );

    console.log(
        "=========================================="
    );


    console.log(
        "Real measurements:",
        validMeasurements.length
    );


    console.log(
        "Measured grid points:",
        points.length
    );


    console.log(
        "Overall average RSSI:",
        overallAverage.toFixed(1),
        "dBm"
    );


    console.log(
        "Overall coverage:",
        coveragePercentage + "%"
    );


    console.log(
        "Weak zones:",
        weakZones
    );


    console.log(
        "------------------------------------------"
    );


    console.log(
        "AI CANDIDATE ANALYSIS:"
    );


    points
        .slice()
        .sort(
            function (a, b) {

                return (
                    b.aiScore -
                    a.aiScore
                );

            }
        )
        .forEach(
            function (point) {

                console.log(

                    point.point +
                    " | Average RSSI: " +
                    point.averageRSSI.toFixed(1) +
                    " dBm" +
                    " | Spatial RSSI: " +
                    point.spatialRSSI.toFixed(1) +
                    " dBm" +
                    " | Coverage: " +
                    point.spatialCoverage.toFixed(1) +
                    "%" +
                    " | AI Score: " +
                    point.aiScore.toFixed(1)

                );

            }
        );


    console.log(
        "------------------------------------------"
    );


    console.log(
        "AI RECOMMENDED LOCATION:",
        bestPoint.location
    );


    console.log(
        "GRID POINT:",
        bestPoint.point
    );


    console.log(
        "AVERAGE RSSI:",
        bestPoint.averageRSSI.toFixed(1),
        "dBm"
    );


    console.log(
        "SPATIAL RSSI:",
        bestPoint.spatialRSSI.toFixed(1),
        "dBm"
    );


    console.log(
        "ESTIMATED COVERAGE:",
        bestPoint.spatialCoverage.toFixed(1) +
        "%"
    );


    console.log(
        "AI PLACEMENT SCORE:",
        bestPoint.aiScore.toFixed(1)
    );


    console.log(
        "WEAK-ZONE PENALTY:",
        bestPoint.weakPenalty.toFixed(1)
    );


    console.log(
        "=========================================="
    );

} 
/* =========================================================
   UPDATE AI INTERFACE
========================================================= */

function updateAIInterface(

    location,

    strongestRSSI,

    averageRSSI,

    totalPoints,

    weakZones,

    coveragePercentage,

    improvement

) {

    /* =====================================================
       AI RECOMMENDED LOCATION
    ===================================================== */

    const title =
        document.getElementById(
            "aiRecommendation"
        );

    if (title) {

        title.textContent =
            "Best measured location: " +
            location;

    }


    /* =====================================================
       AI DESCRIPTION
    ===================================================== */

    const description =
        document.getElementById(
            "aiRecommendationText"
        );

  if (description) {

    description.textContent =
        "Based on the average RSSI measured at each grid point, " +
        location +
        " has the strongest average Wi-Fi signal at " +
        Number(strongestRSSI).toFixed(1) +
        " dBm. The AI analysis identifies this as the suggested router placement location based on the measured RSSI distribution.";
}
    /* =====================================================
       EXPECTED COVERAGE
    ===================================================== */

    const weakReduction =
        document.getElementById(
            "weakReduction"
        );

    if (weakReduction) {

        weakReduction.textContent =
            Number(coveragePercentage || 0) +
            "% coverage";

    }


    /* =====================================================
       RSSI IMPROVEMENT
    ===================================================== */

    const improvementElement =
        document.getElementById(
            "rssiImprovement"
        );

    if (improvementElement) {

        improvementElement.textContent =
            "+" +
            Number(improvement || 0) +
            " dBm";

    }


    /* =====================================================
       RECOMMENDED LOCATION
    ===================================================== */

    const locationElement =
        document.getElementById(
            "recommendedLocation"
        );

    if (locationElement) {

        locationElement.textContent =
            location;

    }


    /* =====================================================
       HEAT MAP AVERAGE RSSI
    ===================================================== */

    const averageElement =
        document.getElementById(
            "averageRSSI"
        );

    if (averageElement) {

        if (
            averageRSSI !== undefined &&
            averageRSSI !== null &&
            !isNaN(Number(averageRSSI))
        ) {

            averageElement.textContent =
                Number(averageRSSI).toFixed(0) +
                " dBm";

        }
        else {

            averageElement.textContent =
                "-- dBm";

        }

    }


    /* =====================================================
       HEAT MAP WEAK ZONES
    ===================================================== */

    const weakZonesElement =
        document.getElementById(
            "weakZones"
        );

    if (weakZonesElement) {

        weakZonesElement.textContent =
            Number(weakZones || 0) +
            " detected";

    }


    /* =====================================================
       COVERAGE SUMMARY PERCENTAGE
    ===================================================== */

    const coverageElement =
        document.getElementById(
            "coveragePercent"
        );

    if (coverageElement) {

        coverageElement.textContent =
            Number(coveragePercentage || 0) +
            "%";

    }


    /* =====================================================
       NUMBER OF MEASURED POINTS
    ===================================================== */

    const pointsElement =
        document.getElementById(
            "measurementPoints"
        );

    if (pointsElement) {

        pointsElement.textContent =
            Number(totalPoints || 0) +
            " POINTS";

    }


    /* =====================================================
       COVERAGE SUMMARY MESSAGE
    ===================================================== */

    const coveragePanel =
        document.getElementById(
            "coverage"
        );

    if (coveragePanel) {

        const heading =
            coveragePanel.querySelector(
                "h3"
            );

        const paragraph =
            coveragePanel.querySelector(
                "p"
            );

        const percentage =
            Number(
                coveragePercentage || 0
            );


        if (heading) {

            if (percentage >= 90) {

                heading.textContent =
                    "Excellent overall coverage";

            }
            else if (percentage >= 75) {

                heading.textContent =
                    "Good overall coverage";

            }
            else if (percentage >= 50) {

                heading.textContent =
                    "Moderate overall coverage";

            }
            else {

                heading.textContent =
                    "Poor overall coverage";

            }

        }


        if (paragraph) {

            paragraph.textContent =
                Number(totalPoints || 0) +
                " measured grid points analyzed. " +
                Number(coveragePercentage || 0) +
                "% of the measured points are within the acceptable signal range.";

        }

    }


    /* =====================================================
       DEBUG INFORMATION
    ===================================================== */

    console.log(
        "===================================="
    );

    console.log(
        "DASHBOARD STATISTICS"
    );

    console.log(
        "===================================="
    );

    console.log(
        "Recommended location:",
        location
    );

    console.log(
        "Best RSSI:",
        Number(strongestRSSI).toFixed(1),
        "dBm"
    );

    console.log(
        "Average RSSI:",
        Number(averageRSSI).toFixed(1),
        "dBm"
    );

    console.log(
        "Measured grid points:",
        totalPoints
    );

    console.log(
        "Weak zones:",
        weakZones
    );

    console.log(
        "Coverage:",
        coveragePercentage + "%"
    );

    console.log(
        "Improvement:",
        improvement + " dBm"
    );

    console.log(
        "===================================="
    );

}
/* =========================================================
   UPDATE COVERAGE DISTRIBUTION
========================================================= */

function updateCoverageDistribution(
    averagedPoints
) {

    if (
        !averagedPoints ||
        averagedPoints.length === 0
    ) {

        return;

    }


    let excellent = 0;

    let good = 0;

    let fair = 0;

    let poor = 0;

    let weak = 0;


    /* =====================================================
       CLASSIFY EACH GRID POINT
    ===================================================== */

    averagedPoints.forEach(
        function (point) {

            const rssi =
                Number(
                    point.averageRSSI
                );


            if (isNaN(rssi)) {

                return;

            }


            if (rssi >= -59) {

                excellent++;

            }
            else if (rssi >= -66) {

                good++;

            }
            else if (rssi >= -74) {

                fair++;

            }
            else if (rssi >= -79) {

                poor++;

            }
            else {

                weak++;

            }

        }
    );


    const total =
        excellent +
        good +
        fair +
        poor +
        weak;


    if (total === 0) {

        return;

    }


    /* =====================================================
       CALCULATE PERCENTAGES
    ===================================================== */

    const percentages = [

        Math.round(
            (excellent / total) * 100
        ),

        Math.round(
            (good / total) * 100
        ),

        Math.round(
            (fair / total) * 100
        ),

        Math.round(
            (poor / total) * 100
        ),

        Math.round(
            (weak / total) * 100
        )

    ];


    /* =====================================================
       FIND COVERAGE ROWS
    ===================================================== */

    const rows =
        document.querySelectorAll(
            "#coverage .coverage-row"
        );


    if (
        !rows ||
        rows.length < 5
    ) {

        console.log(
            "Coverage distribution rows not found."
        );

        return;

    }


    /* =====================================================
       UPDATE EACH ROW
    ===================================================== */

    rows.forEach(
        function (row, index) {

            const percentage =
                percentages[index];


            const percentageText =
                row.querySelector(
                    "strong"
                );


            const progressBar =
                row.querySelector(
                    ".progress-bar"
                );


            if (percentageText) {

                percentageText.textContent =
                    percentage + "%";

            }


            if (progressBar) {

                progressBar.style.width =
                    percentage + "%";

            }

        }
    );


    console.log(
        "Coverage distribution updated:",
        percentages
    );

}
/* =========================================================
   REAL WI-FI INFORMATION
========================================================= */

async function loadWiFiData() {

    try {

        const response =
            await fetch(
                API_BASE +
                "/api/wifi"
            );


        if (!response.ok) {

            throw new Error(
                "Wi-Fi API request failed"
            );

        }


        const wifi =
            await response.json();


        const rssi =
            wifi.rssi;

        const signalPercent =
            wifi.signal_percent;

        const ssid =
            wifi.ssid;

        const band =
            wifi.band;

        const channel =
            wifi.channel;


        /* =========================================
           RSSI
        ========================================= */

        document
            .querySelectorAll(
                '[data-wifi="rssi"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        rssi;

                }
            );


        /* =========================================
           SIGNAL %
        ========================================= */

        document
            .querySelectorAll(
                '[data-wifi="signal-percent"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        signalPercent +
                        "%";

                }
            );


        /* =========================================
           SSID
        ========================================= */

        document
            .querySelectorAll(
                '[data-wifi="ssid"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        ssid;

                }
            );


        /* =========================================
           BAND
        ========================================= */

        document
            .querySelectorAll(
                '[data-wifi="band"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        band;

                }
            );


        /* =========================================
           CHANNEL
        ========================================= */

        document
            .querySelectorAll(
                '[data-wifi="channel"]'
            )
            .forEach(
                function (element) {

                    element.textContent =
                        channel;

                }
            );


        console.log(
            "REAL WI-FI DATA:",
            wifi
        );


        /* =========================================
           TOTAL MEASUREMENTS
        ========================================= */

        const dataResponse =
            await fetch(
                API_BASE +
                "/api/data"
            );


        if (dataResponse.ok) {

            const measurements =
                await dataResponse.json();


            const totalElement =
                document.getElementById(
                    "totalMeasurements"
                );


            if (totalElement) {

                totalElement.textContent =
                    measurements.length;

            }

        }


    } catch (error) {

        console.error(
            "Could not load Wi-Fi data:",
            error
        );

    }

}


/* =========================================================
   UPDATE CURRENT LOCATION
========================================================= */

async function updateLocation() {

    try {

        const response =
            await fetch(
                API_BASE +
                "/api/data"
            );


        if (!response.ok) {

            throw new Error(
                "Measurement API request failed"
            );

        }


        const measurements =
            await response.json();


        if (
            !measurements ||
            measurements.length === 0
        ) {
            return;
        }


        const latest =
            measurements[
                measurements.length - 1
            ];


        const location =
            latest.location ||
            "Unknown Location";


        const measurementLocation =
            document.getElementById(
                "measurementLocation"
            );


        const currentLocation =
            document.getElementById(
                "currentLocation"
            );


        if (measurementLocation) {

            measurementLocation.textContent =
                location;

        }


        if (currentLocation) {

            currentLocation.textContent =
                location;

        }


        console.log(
            "Current location:",
            location
        );


    } catch (error) {

        console.error(
            "Could not update location:",
            error
        );

    }

}


/* =========================================================
   RSSI CHART
========================================================= */

function initializeRSSIChart() {

    const canvas =
        document.getElementById(
            "rssiChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const context =
        canvas.getContext("2d");


    const gradient =
        context.createLinearGradient(
            0,
            0,
            0,
            300
        );


    gradient.addColorStop(
        0,
        "rgba(37, 99, 235, 0.28)"
    );


    gradient.addColorStop(
        1,
        "rgba(37, 99, 235, 0.02)"
    );


    const chart =
        new Chart(
            context,
            {

                type: "line",

                data: {

                    labels: [],

                    datasets: [
                        {

                            label: "RSSI",

                            data: [],

                            borderColor:
                                "#2563eb",

                            backgroundColor:
                                gradient,

                            borderWidth: 3,

                            fill: true,

                            tension: 0.4,

                            pointRadius: 4,

                            pointHoverRadius: 6,

                            pointBackgroundColor:
                                "#ffffff",

                            pointBorderColor:
                                "#2563eb",

                            pointBorderWidth: 2

                        }
                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    interaction: {

                        intersect: false,

                        mode: "index"

                    },


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            "RSSI: " +
                                            context.parsed.y +
                                            " dBm"
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            min: -90,

                            max: -40,

                            ticks: {

                                callback:
                                    function (
                                        value
                                    ) {

                                        return (
                                            value +
                                            " dBm"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );


    /* =========================================
       LOAD REAL CHART DATA
    ========================================= */

    async function updateChart() {

        try {

            const response =
                await fetch(
                    API_BASE +
                    "/api/data"
                );


            if (!response.ok) {
                return;
            }


            const measurements =
                await response.json();


            const valid =
                measurements.filter(
                    function (item) {

                        return (
                            item.rssi !== undefined &&
                            !isNaN(
                                Number(item.rssi)
                            )
                        );

                    }
                );


            const recent =
                valid.slice(-12);


            const labels =
                recent.map(
                    function (item) {

                        if (
                            !item.timestamp
                        ) {
                            return "";
                        }


                        const date =
                            new Date(
                                item.timestamp
                            );


                        if (
                            isNaN(
                                date.getTime()
                            )
                        ) {
                            return "";
                        }


                        return (
                            date
                                .getHours()
                                .toString()
                                .padStart(2, "0")
                            +
                            ":" +
                            date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0")
                            +
                            ":" +
                            date
                                .getSeconds()
                                .toString()
                                .padStart(2, "0")
                        );

                    }
                );


            const values =
                recent.map(
                    function (item) {

                        return Number(
                            item.rssi
                        );

                    }
                );


            chart.data.labels =
                labels;


            chart.data.datasets[0].data =
                values;


            chart.update();


        } catch (error) {

            console.error(
                "RSSI chart error:",
                error
            );

        }

    }


    updateChart();


    setInterval(
        updateChart,
        5000
    );

}


/* =========================================================
   RECENT MEASUREMENTS TABLE
========================================================= */

async function loadRecentMeasurements() {

    try {

        const response =
            await fetch(
                API_BASE +
                "/api/data"
            );


        if (!response.ok) {

            throw new Error(
                "Could not load measurements"
            );

        }


        const measurements =
            await response.json();


        const tableBody =
            document.getElementById(
                "measurementsBody"
            );


        if (!tableBody) {
            return;
        }


        tableBody.innerHTML = "";


        if (
            !measurements ||
            measurements.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No measurements available
                    </td>
                </tr>
            `;

            return;

        }


        /* =========================================
           LATEST 10
        ========================================= */

        const recent =
            measurements
                .slice(-10)
                .reverse();


        recent.forEach(
            function (
                measurement,
                index
            ) {


                const row =
                    document.createElement(
                        "tr"
                    );


                /* =================================
                   ID
                ================================= */

                const id =
                    measurement.id ||
                    (
                        measurements.length -
                        index
                    );


                /* =================================
                   LOCATION
                ================================= */

                const location =
                    measurement.location ||
                    "Unknown Location";


                /* =================================
                   RSSI
                ================================= */

                const rssi =
                    Number(
                        measurement.rssi
                    );


                /* =================================
                   SIGNAL %
                ================================= */

                const signal =
                    Number(
                        measurement.signal_percent
                    );


                /* =================================
                   SSID
                ================================= */

                const ssid =
                    measurement.ssid ||
                    "Unknown Wi-Fi";


                /* =================================
                   TIME
                ================================= */

                let timeText =
                    "Recent";


                if (
                    measurement.timestamp
                ) {

                    const date =
                        new Date(
                            measurement.timestamp
                        );


                    if (
                        !isNaN(
                            date.getTime()
                        )
                    ) {

                        const seconds =
                            Math.max(

                                0,

                                Math.floor(
                                    (
                                        new Date() -
                                        date
                                    ) /
                                    1000
                                )

                            );


                        if (
                            seconds < 60
                        ) {

                            timeText =
                                seconds +
                                " sec ago";

                        } else {

                            timeText =
                                Math.floor(
                                    seconds /
                                    60
                                ) +
                                " min ago";

                        }

                    }

                }


                /* =================================
                   STATUS
                ================================= */

                let status =
                    "Unknown";


                let statusClass =
                    "";


                if (!isNaN(rssi)) {

                    if (
                        rssi >= -59
                    ) {

                        status =
                            "Excellent";

                        statusClass =
                            "excellent";

                    } else if (
                        rssi >= -66
                    ) {

                        status =
                            "Good";

                        statusClass =
                            "good";

                    } else if (
                        rssi >= -74
                    ) {

                        status =
                            "Fair";

                        statusClass =
                            "fair";

                    } else if (
                        rssi >= -79
                    ) {

                        status =
                            "Poor";

                        statusClass =
                            "poor";

                    } else {

                        status =
                            "Weak";

                        statusClass =
                            "weak";

                    }

                }


                /* =================================
                   RSSI TEXT CLASS
                ================================= */

                let rssiClass =
                    "";


                if (!isNaN(rssi)) {

                    if (
                        rssi >= -66
                    ) {

                        rssiClass =
                            "green-text";

                    } else if (
                        rssi >= -74
                    ) {

                        rssiClass =
                            "yellow-text";

                    } else if (
                        rssi >= -79
                    ) {

                        rssiClass =
                            "orange-text";

                    } else {

                        rssiClass =
                            "red-text";

                    }

                }


                /* =================================
                   TABLE ROW
                ================================= */

                row.innerHTML = `

                    <td>
                        <strong>
                            #M-${id}
                        </strong>
                    </td>

                    <td>
                        ${location}
                    </td>

                    <td>
                        <strong class="${rssiClass}">
                            ${
                                isNaN(rssi)
                                    ? "N/A"
                                    : rssi + " dBm"
                            }
                        </strong>
                    </td>

                    <td>
                        ${
                            isNaN(signal)
                                ? "N/A"
                                : signal + "%"
                        }
                    </td>

                    <td>
                        ${ssid}
                    </td>

                    <td>
                        ${timeText}
                    </td>

                    <td>
                        <span
                            class="table-status ${statusClass}"
                        >
                            ${status}
                        </span>
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Recent measurements error:",
            error
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        function (item) {

            item.addEventListener(
                "click",
                function () {

                    navItems.forEach(
                        function (navItem) {

                            navItem.classList.remove(
                                "active"
                            );

                        }
                    );


                    item.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   DEMO BUTTONS
========================================================= */

function initializeDemoButtons() {

    const buttons =
        document.querySelectorAll(
            ".secondary-button, .text-button, .outline-button, .period-button"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (
                        button.classList.contains(
                            "period-button"
                        )
                    ) {

                        document
                            .querySelectorAll(
                                ".period-button"
                            )
                            .forEach(
                                function (
                                    periodButton
                                ) {

                                    periodButton.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        button.classList.add(
                            "active"
                        );

                    }


                    const original =
                        button.innerHTML;


                    if (
                        button.classList.contains(
                            "outline-button"
                        )
                    ) {

                        button.textContent =
                            "Demo Export Ready";

                    }


                    else if (
                        button.classList.contains(
                            "secondary-button"
                        )
                    ) {

                        button.innerHTML =
                            "Analysis Preview Loaded ✓";

                    }


                    else if (
                        button.classList.contains(
                            "text-button"
                        )
                    ) {

                        button.innerHTML =
                            "Demo list already displayed ✓";

                    }


                    setTimeout(
                        function () {

                            if (
                                button.classList.contains(
                                    "outline-button"
                                )
                            ) {

                                button.innerHTML =
                                    original;

                            }

                        },
                        2000
                    );

                }
            );

        }
    );

}


/* =========================================================
   BROWSER LOCATION
========================================================= */

function getCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        console.error(
            "Geolocation is not supported."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            console.log(
                "Latitude:",
                position.coords.latitude
            );


            console.log(
                "Longitude:",
                position.coords.longitude
            );


            console.log(
                "Accuracy:",
                position.coords.accuracy,
                "meters"
            );

        },


        function (error) {

            console.error(
                "Location error:",
                error.message
            );

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    function () {

        loadWiFiData();

    },
    5000
);


setInterval(
    function () {

        updateLocation();

    },
    5000
);


setInterval(
    function () {

        loadRecentMeasurements();

    },
    5000
);
