console.log("Initiating");
document.querySelector("#search-and-summary").style.display = "none";
document.querySelector("#infected-country-list").style.display = "none";

const DOMElements = {
    countryListTable: "#country-list-table",
    totalCases: "#confirmed-cases",
    newCases: "#confirmed-today",
    recoveredPatients: "#recovered-patients",
    deaths: "#all-deaths",
    newDeaths: "#new-deaths-today",
    searchInput: "#search-country",
};

axios
    .get("https://api.covid19api.com/summary")
    .then((res) => resProcess(res))
    .catch((err) => console.log(err));

resProcess = (res) => {
    console.log(res.status);
    document.querySelector("#search-and-summary").style.display = "block";
    document.querySelector("#loading").style.display = "none";
    document.querySelector("#loading-2").style.display = "block";

    let data = res.data.Countries;
    let dataToSort = [...data];

    // console.log(data);

    let processedInput = processInputData(data);

    let summaryData = calculateSummary(data);
    displaySummary(summaryData);
    displayTopFive(dataToSort);

    // let processedData = addCommas(data, [
    //     "TotalConfirmed",
    //     "NewConfirmed",
    //     "TotalDeaths",
    //     "NewDeaths",
    //     "TotalRecovered",
    // ]);

    axios
        .get("https://api.covid19api.com/countries")
        .then((res) => {
            // console.log(res);

            let processedSlugData = processSlugData(res.data);
            // displayCountryStats(processedData, processedSlugData);
            displayCountryStats(data, processedSlugData);

            document.querySelector("#loading-2").style.display = "none";
            document.querySelector("#infected-country-list").style.display =
                "block";

            addEventListenerOnRows(processedInput);
            searchFilter();
        })
        .catch((err) => console.log(err));
};

sortCompareFunc = (a, b) => {
    if (a.TotalConfirmed < b.TotalConfirmed) {
        return -1;
    }
    if (a.TotalConfirmed > b.TotalConfirmed) {
        return 1;
    }
    return 0;
};

addCommas = (data, keys = []) => {
    console.log("Here");
    var allKeys = Object.keys(data);
    if (keys.length === 0) {
        keys = allKeys;
    }
    var retData = [];
    allKeys.forEach((key) => {
        if (keys.includes(key)) {
            var tempNum = data[key].toString().trim();
            var keyLen = tempNum.length;
            if (keyLen > 3) {
                numCommas = Math.ceil(keyLen / 3) - 1;
                // console.log(numCommas);
                var commaPos = [];
                var remainder = keyLen % 3;
                var commaCount = 0;

                if (remainder !== 0) {
                    var pos = remainder;
                } else {
                    pos = 3;
                }

                commaPos.push(pos);
                commaCount++;

                while (commaCount < numCommas) {
                    pos = pos + 4;
                    commaCount++;
                    commaPos.push(pos);
                }

                commaPos.forEach((pos) => {
                    tempNum =
                        tempNum.substring(0, pos) +
                        "," +
                        tempNum.substring(pos);
                });
            }

            retData[key] = tempNum;
        } else {
            retData[key] = data[key];
        }
    });

    return retData;
};

calculateSummary = (data) => {
    let totalCases, newCases, recoveredPatients, deaths, newDeaths;

    [totalCases, newCases, recoveredPatients, deaths, newDeaths] = [
        0,
        0,
        0,
        0,
        0,
    ];

    data.forEach((value) => {
        totalCases += value.TotalConfirmed;
        newCases += value.NewConfirmed;
        recoveredPatients += value.TotalRecovered;
        deaths += value.TotalDeaths;
        newDeaths += value.NewDeaths;
    });

    return {
        totalCases: totalCases,
        newCases: newCases,
        recoveredPatients: recoveredPatients,
        deaths: deaths,
        newDeaths: newDeaths,
    };
};

displaySummary = (summaryData) => {
    summaryData = addCommas(summaryData);
    document.querySelector(DOMElements.totalCases).innerText =
        summaryData.totalCases;
    document.querySelector(DOMElements.newCases).innerText =
        summaryData.newCases;
    document.querySelector(DOMElements.recoveredPatients).innerText =
        summaryData.recoveredPatients;
    document.querySelector(DOMElements.deaths).innerText = summaryData.deaths;
    document.querySelector(DOMElements.newDeaths).innerText =
        summaryData.newDeaths;
};

displayTopFive = (data) => {
    data = data.sort(sortCompareFunc).reverse().slice(0, 5);
    data.forEach((value, index) => {
        var showVal = addCommas(value, ["TotalConfirmed"]);
        document.querySelector(
            `#most-${index + 1}`
        ).innerHTML = `${showVal.Country}<span class="badge orange white-text">${showVal.TotalConfirmed}</span>`;
    });
};

processInputData = (inputData) => {
    let processedInputData = {};

    inputData.forEach((row) => {
        processedInputData[row.Country] = row;
    });

    return processedInputData;
};

processSlugData = (slugData) => {
    let processedData = {};

    slugData.forEach((value) => {
        processedData[value.Country] = value.Slug;
    });

    return processedData;
};

displayCountryStats = (data, slugData) => {
    // display country stats on the table

    let countryList = document.querySelector(DOMElements.countryListTable);

    data.forEach((value, index) => {
        var showVal = addCommas(value, [
            "TotalConfirmed",
            "TotalDeaths",
            "TotalRecovered",
        ]);
        countryList.innerHTML += `<tr data-slug="${slugData[showVal.Country]}">
        <td>${index + 1}</td>
        <td>${showVal.Country}</td>
        <td>${showVal.TotalConfirmed}</td>
        <td>${showVal.TotalDeaths}</td>
        <td>${showVal.TotalRecovered}</td>
    </tr>`;
    });
};

searchFilter = () => {
    let input, filter, table, tr, td, i, countryName;
    input = document.querySelector(DOMElements.searchInput);

    input.addEventListener("input", () => {
        if (input.value === "") {
            document.querySelector("#summary-box").style.display = "block";
            document.querySelector("#table-header").innerText =
                "All Infected Countries";
        } else {
            document.querySelector("#summary-box").style.display = "none";
            document.querySelector("#table-header").innerText =
                "Search results";
        }

        filter = input.value.toLowerCase();
        table = document.querySelector(DOMElements.countryListTable);
        tr = table.querySelectorAll("tr");
        tr.forEach((tr, index) => {
            td = tr.querySelectorAll("td")[1];
            if (td) {
                countryName = td.textContent || td.innerText;
                if (countryName.toLowerCase().indexOf(filter) > -1) {
                    tr.style.display = "";
                } else {
                    tr.style.display = "none";
                }
            }
        });
    });
};

addEventListenerOnRows = (processedInput) => {
    const rows = document.querySelectorAll("tr[data-slug]");

    rows.forEach((row) => {
        row.addEventListener("click", () => {
            // steps to execute
            // console.log(`Row clicked ${row.getAttribute("data-slug")}`);
            let countryName = row.querySelectorAll("td")[1].innerText;
            // console.log(countryName);
            let countryData = processedInput[countryName];
            // console.log(countryData);
            openModal(countryData, row.getAttribute("data-slug"));
        });
    });
};

openModal = (countryData, slug) => {
    let elem = document.querySelector(".modal");
    let instance = M.Modal.init(elem);

    document.querySelector("#modal-country-name").innerText =
        countryData.Country;
    document.querySelector("#modal-cofirmed-cases").innerText =
        countryData.TotalConfirmed;
    document.querySelector("#modal-confirmed-today").innerText =
        countryData.NewConfirmed;
    document.querySelector("#modal-all-deaths").innerText =
        countryData.TotalDeaths;
    document.querySelector("#modal-all-deaths-today").innerText =
        countryData.NewDeaths;
    document.querySelector("#modal-recovered-patients").innerText =
        countryData.TotalRecovered;

    // document.querySelector("#chart").style.display = "none";
    document.querySelector("#loading-3").style.display = "block";

    axios
        .get(
            `https://api.covid19api.com/total/country/${slug}/status/confirmed`
        )
        .then((res) => {
            // console.log(res);
            document.querySelector("#loading-3").style.display = "none";
            let chartElement = document.querySelector("#country-chart");
            chartElement.parentNode.removeChild(chartElement);

            document.querySelector(
                "#chart"
            ).innerHTML += `<canvas id="country-chart" width="300" height="300"></canvas>`;
            // console.log(window.innerHeight);
            // console.log(window.innerWidth);
            if (window.innerHeight < window.innerWidth) {
                // console.log("boop");
                document
                    .querySelector("#country-chart")
                    .setAttribute("height", 150);
                // document.querySelector("#chart").setAttribute("height", 300);
            }
            // document.querySelector("#chart").style.display = "block";

            let chartData;
            chartData = processCountryData(res.data);

            // console.log(chartData);

            let ctx = document.getElementById("country-chart");
            let chart = new Chart(ctx, {
                type: "line",
                data: {
                    // labels: [1500, "", "", "", 1800, "", "", "", "", 2050],
                    labels: chartData.dataLabels,
                    datasets: [
                        {
                            data: chartData.dataPoints,
                            label: "Infected",
                            borderColor: "#ff9800",
                            fill: false,
                        },
                    ],
                },
                options: {
                    title: {
                        display: true,
                        text: `COVID-19 contamination over time in ${countryData.Country}`,
                        position: "bottom",
                    },
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: true,
                                    userCallback: function (value) {
                                        value = addCommas({ data: value });
                                        return value.data;
                                    },
                                },
                            },
                        ],
                    },
                },
            });

            axios
                .get(
                    `https://api.covid19api.com/total/country/${slug}/status/deaths`
                )
                .then((res) => {
                    chartData = processCountryData(res.data);
                    // console.log(chart.data.datasets);
                    let newLine = {
                        data: chartData.dataPoints,
                        label: "Deaths",
                        borderColor: "#e51c23",
                        fill: false,
                    };
                    chart.data.datasets.push(newLine);
                    chart.update();

                    axios
                        .get(
                            `https://api.covid19api.com/total/country/${slug}/status/recovered`
                        )
                        .then((res) => {
                            chartData = processCountryData(res.data);
                            let newerLine = {
                                data: chartData.dataPoints,
                                label: "Recovered",
                                borderColor: "#4caf50",
                                fill: false,
                            };
                            chart.data.datasets.push(newerLine);
                            chart.update();
                        })
                        .catch((err_3) => console.log(err_3));
                })
                .catch((err_2) => console.log(err_2));
        })
        .catch((err_1) => console.log(err_1));

    instance.open();
};

processCountryData = (countryData) => {
    let dataLabelPoints, dataLabels, processedData;
    dataLabelPoints = [];
    dataLabels = [];

    processedData = [];

    countryData.forEach((row) => {
        processedData.push(row.Cases);
        dataLabels.push(row.Date.slice(0, 10));
    });

    return {
        dataPoints: processedData,
        dataLabels: dataLabels,
    };
};
