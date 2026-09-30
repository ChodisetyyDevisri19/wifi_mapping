document.addEventListener("DOMContentLoaded", function () {

    initializeLogin();
    initializeDashboard();

});


/* =========================================================
   RENDER BACKEND
========================================================= */

/*
   The dashboard and Flask backend are hosted on the
   same Render server.

   Therefore we use relative API URLs such as:

       /api/wifi
       /api/data
       /api/analyze

   This works both on Render and locally.
*/

const API_BASE = "";


/* =========================================================
   LOGIN PAGE
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


    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";

                togglePassword.textContent =
                    isPassword
                        ? "Hide"
                        : "Show";

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


            /*
             * Existing frontend demo login.
             */

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

            }

            else {

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

    initializeHeatMap();

    initializeRSSIChart();

    initializeNavigation();

    initializeDemoButtons();

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


    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        function (navItem) {

            navItem.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        }
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


        updateAIRecommendation(
            measurements
        );


        /*
         * Clear old heat map.
         */

        heatmapGrid.innerHTML = "";


        const columnLabels = [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H"
        ];


        const gridMeasurements = {};


        /*
         * Store measurements according
         * to their grid coordinates.
         */

        measurements.forEach(
            function (measurement) {

                const location =
                    String(
                        measurement.location ||
                        ""
                    );


                const match =
                    location.match(
                        /\b([A-H])\s*[- ]?\s*([1-5])\b/i
                    );


                if (match) {

                    const coordinate =
                        match[1].toUpperCase()
                        +
                        match[2];


                    gridMeasurements[
                        coordinate
                    ] = measurement;

                }

            }
        );


        /*
         * If no grid coordinate exists,
         * show latest measurement at B3.
         */

        if (
            measurements.length > 0 &&
            Object.keys(
                gridMeasurements
            ).length === 0
        ) {

            const latest =
                measurements[
                    measurements.length - 1
                ];


            gridMeasurements["B3"] =
                latest;

        }


        /*
         * Create 5 x 8 grid.
         */

        for (
            let row = 1;
            row <= 5;
            row++
        ) {

            for (
                let col = 0;
                col < columnLabels.length;
                col++
            ) {

                const cell =
                    document.createElement(
                        "div"
                    );


                const coordinate =
                    columnLabels[col]
                    +
                    row;


                const measurement =
                    gridMeasurements[
                        coordinate
                    ];


                cell.className =
                    "heat-cell";


                if (!measurement) {

                    cell.textContent = "—";

                    cell.title =
                        coordinate +
                        " | No measurement";

                }

                else {

                    const rssi =
                        Number(
                            measurement.rssi
                        );


                    cell.className =
                        "heat-cell "
                        +
                        getSignalClass(
                            rssi
                        );


                    cell.textContent =
                        rssi;


                    cell.title =
                        coordinate
                        +
                        " | RSSI: "
                        +
                        rssi
                        +
                        " dBm";


                    /*
                     * Highlight latest measurement.
                     */

                    if (
                        measurement ===
                        measurements[
                            measurements.length - 1
                        ]
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


        /*
         * Update average RSSI and weak zones.
         */

        if (
            measurements.length > 0
        ) {

            const rssiValues =
                measurements
                    .map(
                        item =>
                            Number(item.rssi)
                    )
                    .filter(
                        value =>
                            !isNaN(value)
                    );


            if (
                rssiValues.length > 0
            ) {

                const averageRSSI =
                    rssiValues.reduce(
                        (
                            sum,
                            value
                        ) =>
                            sum + value,
                        0
                    )
                    /
                    rssiValues.length;


                const averageElement =
                    document.getElementById(
                        "averageRSSI"
                    );


                if (averageElement) {

                    averageElement.textContent =
                        Math.round(
                            averageRSSI
                        )
                        +
                        " dBm";

                }


                const weakZones =
                    rssiValues.filter(
                        value =>
                            value <= -80
                    ).length;


                const weakElement =
                    document.getElementById(
                        "weakZones"
                    );


                if (weakElement) {

                    weakElement.textContent =
                        weakZones
                        +
                        " detected";

                }

            }

        }


    }

    catch (error) {

        console.error(
            "Could not load heat map data:",
            error
        );

    }

}


/* =========================================================
   RSSI SIGNAL CLASS
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
   RSSI CHART
========================================================= */

function initializeRSSIChart() {

    const chartCanvas =
        document.getElementById(
            "rssiChart"
        );


    if (
        !chartCanvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }


    const chartContext =
        chartCanvas.getContext(
            "2d"
        );


    const gradient =
        chartContext.createLinearGradient(
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


    new Chart(
        chartContext,
        {

            type: "line",


            data: {

                labels: [
                    "10:00",
                    "10:05",
                    "10:10",
                    "10:15",
                    "10:20",
                    "10:25",
                    "10:30",
                    "10:35",
                    "10:40",
                    "10:45",
                    "10:50",
                    "10:55"
                ],


                datasets: [

                    {

                        label: "RSSI",

                        data: [
                            -60,
                            -57,
                            -62,
                            -55,
                            -58,
                            -65,
                            -61,
                            -56,
                            -53,
                            -57,
                            -54,
                            -52
                        ],

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

                        backgroundColor:
                            "#0b1630",

                        padding: 12,

                        titleColor:
                            "#ffffff",

                        bodyColor:
                            "#dbeafe",

                        displayColors:
                            false,


                        callbacks: {

                            label:
                                function (
                                    context
                                ) {

                                    return (
                                        "RSSI: "
                                        +
                                        context.parsed.y
                                        +
                                        " dBm"
                                    );

                                }

                        }

                    }

                },


                scales: {

                    x: {

                        grid: {

                            display: false

                        },


                        ticks: {

                            color:
                                "#94a3b8",

                            font: {

                                size: 10

                            }

                        }

                    },


                    y: {

                        min: -90,

                        max: -40,


                        ticks: {

                            color:
                                "#94a3b8",

                            font: {

                                size: 10

                            },


                            callback:
                                function (
                                    value
                                ) {

                                    return (
                                        value
                                        +
                                        " dBm"
                                    );

                                }

                        },


                        grid: {

                            color:
                                "rgba(148, 163, 184, 0.16)"

                        }

                    }

                }

            }

        }
    );

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

    const demoButtons =
        document.querySelectorAll(
            ".secondary-button, .text-button, .outline-button, .period-button"
        );


    demoButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const originalText =
                        button.textContent;


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
                            "Analysis Preview Loaded <span>✓</span>";

                    }

                    else if (
                        button.classList.contains(
                            "text-button"
                        )
                    ) {

                        button.innerHTML =
                            "Demo list already displayed <span>✓</span>";

                    }


                    setTimeout(
                        function () {

                            if (
                                button.classList.contains(
                                    "outline-button"
                                )
                            ) {

                                button.textContent =
                                    originalText;

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
   LOAD REAL WIFI DATA
========================================================= */

async function loadWiFiData() {

    try {

        const response =
            await fetch(
                API_BASE + "/api/wifi"
            );


        if (!response.ok) {

            throw new Error(
                "Wi-Fi API request failed"
            );

        }


        const wifi =
            await response.json();


        console.log(
            "Real Wi-Fi data:",
            wifi
        );


        if (
            wifi.status === "error"
        ) {

            console.log(
                "No measurement available yet."
            );

            return;

        }


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


        /* -----------------------------------------
           RSSI
        ----------------------------------------- */

        const rssiElements =
            document.querySelectorAll(
                '[data-wifi="rssi"]'
            );


        rssiElements.forEach(
            function (element) {

                element.textContent =
                    rssi;

            }
        );


        /* -----------------------------------------
           SIGNAL %
        ----------------------------------------- */

        const signalElements =
            document.querySelectorAll(
                '[data-wifi="signal-percent"]'
            );


        signalElements.forEach(
            function (element) {

                element.textContent =
                    signalPercent
                    +
                    "%";

            }
        );


        /* -----------------------------------------
           SSID
        ----------------------------------------- */

        const ssidElements =
            document.querySelectorAll(
                '[data-wifi="ssid"]'
            );


        ssidElements.forEach(
            function (element) {

                element.textContent =
                    ssid;

            }
        );


        /* -----------------------------------------
           BAND
        ----------------------------------------- */

        const bandElements =
            document.querySelectorAll(
                '[data-wifi="band"]'
            );


        bandElements.forEach(
            function (element) {

                element.textContent =
                    band;

            }
        );


        /* -----------------------------------------
           CHANNEL
        ----------------------------------------- */

        const channelElements =
            document.querySelectorAll(
                '[data-wifi="channel"]'
            );


        channelElements.forEach(
            function (element) {

                element.textContent =
                    channel;

            }
        );


        console.log(
            "RSSI:",
            rssi,
            "dBm"
        );

        console.log(
            "Signal:",
            signalPercent + "%"
        );

        console.log(
            "SSID:",
            ssid
        );

        console.log(
            "Band:",
            band
        );

        console.log(
            "Channel:",
            channel
        );


        /* -----------------------------------------
           TOTAL MEASUREMENTS
        ----------------------------------------- */

        const dataResponse =
            await fetch(
                API_BASE + "/api/data"
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

    }

    catch (error) {

        console.error(
            "Could not load Wi-Fi data:",
            error
        );

    }

}


/* =========================================================
   UPDATE LOCATION
========================================================= */

async function updateLocation() {

    try {

        const response =
            await fetch(
                API_BASE + "/api/data"
            );


        if (!response.ok) {

            throw new Error(
                "Measurement API request failed"
            );

        }


        const measurements =
            await response.json();


        if (
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


        const locationElement =
            document.getElementById(
                "measurementLocation"
            );


        const currentLocationElement =
            document.getElementById(
                "currentLocation"
            );


        if (locationElement) {

            locationElement.textContent =
                location;

        }


        if (
            currentLocationElement
        ) {

            currentLocationElement.textContent =
                location;

        }


        console.log(
            "Latest measurement location:",
            location
        );

    }

    catch (error) {

        console.error(
            "Could not load measurement location:",
            error
        );

    }

}


/* =========================================================
   AI RECOMMENDATION
========================================================= */

function updateAIRecommendation(
    measurements
) {

    if (
        !measurements ||
        measurements.length === 0
    ) {

        return;

    }


    const validMeasurements =
        measurements

            .filter(
                item =>
                    item.rssi !== undefined &&
                    !isNaN(
                        Number(
                            item.rssi
                        )
                    )
            )

            .map(
                item => ({

                    rssi:
                        Number(
                            item.rssi
                        ),

                    location:
                        item.location ||
                        "Unknown Location"

                })
            );


    if (
        validMeasurements.length === 0
    ) {

        return;

    }


    /*
     * Find strongest signal.
     *
     * Example:
     * -50 dBm is stronger than -80 dBm.
     */

    const strongest =
        validMeasurements.reduce(
            function (
                best,
                current
            ) {

                return current.rssi >
                    best.rssi
                    ? current
                    : best;

            }
        );


    /* -----------------------------------------
       AVERAGE RSSI
    ----------------------------------------- */

    const averageRSSI =
        validMeasurements.reduce(
            function (
                sum,
                item
            ) {

                return (
                    sum +
                    item.rssi
                );

            },
            0
        )
        /
        validMeasurements.length;


    /* -----------------------------------------
       WEAK MEASUREMENTS
    ----------------------------------------- */

    const weakCount =
        validMeasurements.filter(
            item =>
                item.rssi <= -80
        ).length;


    /* -----------------------------------------
       COVERAGE
    ----------------------------------------- */

    const coveragePercentage =
        Math.round(

            (
                (
                    validMeasurements.length -
                    weakCount
                )
                /
                validMeasurements.length
            )
            *
            100

        );


    /* -----------------------------------------
       ESTIMATED IMPROVEMENT
    ----------------------------------------- */

    const improvement =
        Math.max(
            0,
            Math.round(
                strongest.rssi -
                averageRSSI
            )
        );


    /* -----------------------------------------
       AI RECOMMENDATION TITLE
    ----------------------------------------- */

    const title =
        document.getElementById(
            "aiRecommendation"
        );


    if (title) {

        title.textContent =
            "Best measured location: "
            +
            strongest.location;

    }


    /* -----------------------------------------
       AI DESCRIPTION
    ----------------------------------------- */

    const description =
        document.getElementById(
            "aiRecommendationText"
        );


    if (description) {

        description.textContent =
            "The strongest measured Wi-Fi signal is "
            +
            strongest.rssi
            +
            " dBm. The system recommends this measured location as the preferred router placement point.";

    }


    /* -----------------------------------------
       COVERAGE RESULT
    ----------------------------------------- */

    const weakReduction =
        document.getElementById(
            "weakReduction"
        );


    if (weakReduction) {

        weakReduction.textContent =
            coveragePercentage
            +
            "% coverage";

    }


    /* -----------------------------------------
       RSSI IMPROVEMENT
    ----------------------------------------- */

    const improvementElement =
        document.getElementById(
            "rssiImprovement"
        );


    if (improvementElement) {

        improvementElement.textContent =
            "+"
            +
            improvement
            +
            " dBm";

    }


    /* -----------------------------------------
       RECOMMENDED LOCATION
    ----------------------------------------- */

    const locationElement =
        document.getElementById(
            "recommendedLocation"
        );


    if (locationElement) {

        locationElement.textContent =
            strongest.location;

    }


    console.log(
        "========== AI RECOMMENDATION =========="
    );

    console.log(
        "Total measurements:",
        validMeasurements.length
    );

    console.log(
        "Strongest RSSI:",
        strongest.rssi + " dBm"
    );

    console.log(
        "Best location:",
        strongest.location
    );

    console.log(
        "Average RSSI:",
        averageRSSI.toFixed(1)
        +
        " dBm"
    );

    console.log(
        "Weak measurements:",
        weakCount
    );

    console.log(
        "Coverage:",
        coveragePercentage
        +
        "%"
    );

    console.log(
        "Estimated improvement:",
        improvement
        +
        " dBm"
    );

    console.log(
        "======================================="
    );

}


/* =========================================================
   START REAL-TIME UPDATES
========================================================= */

loadWiFiData();

updateLocation();


/*
 * Refresh dashboard every 5 seconds.
 */

setInterval(
    loadWiFiData,
    5000
);


setInterval(
    updateLocation,
    5000
);
