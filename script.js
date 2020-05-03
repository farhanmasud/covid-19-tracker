console.log("Initiating");

const DOMElements = {
    countryListTable: "#country-list-table",
    totalCases: "#confirmed-cases",
    newCases: "#confirmed-today",
    recoveredPatients: "#recovered-patients",
    deaths: "#all-deaths",
    newDeaths: "#new-deaths-today",
    searchInput: "#search-country",
    searchAndSummary: "#search-and-summary",
    loading1: "#loading",
    loading2: "#loading-2",
    loading3: "#loading-3",
    infectedCountryList: "#infected-country-list",
    summaryBox: "#summary-box",
    tableHeader: "#table-header",
    modal: ".modal",
    modalCountryName: "#modal-country-name",
    modalRecoveredPatients: "#modal-recovered-patients",
    modalAllDeathsToday: "#modal-all-deaths-today",
    modalAllDeaths: "#modal-all-deaths",
    modalConfirmedToday: "#modal-confirmed-today",
    modalConfirmedCases: "#modal-cofirmed-cases",
    modalCountryChartId: "country-chart",
    modalCountryChartDiv: "#chart",
    modalCountryChartDailyId: "country-chart-daily",
    modalCountryChartDailyDiv: "#chart-daily",
};

document.querySelector(DOMElements.searchAndSummary).style.display = "none";
document.querySelector(DOMElements.infectedCountryList).style.display = "none";

axios
    .get("https://api.covid19api.com/summary")
    .then((res) => resProcess(res))
    .catch((err) => console.log(err));

resProcess = (res) => {
    console.log(res.status);
    document.querySelector(DOMElements.searchAndSummary).style.display =
        "block";
    document.querySelector(DOMElements.loading1).style.display = "none";
    document.querySelector(DOMElements.loading2).style.display = "block";

    let data = res.data.Countries;
    let dataToSort = [...data];
    let processedInput = processInputData(data);
    let summaryData = calculateSummary(data);

    displaySummary(summaryData);
    displayTopFive(dataToSort);

    axios
        .get("https://api.covid19api.com/countries")
        .then((res) => {
            let processedSlugData = processSlugData(res.data);
            displayCountryStats(data, processedSlugData);

            document.querySelector(DOMElements.loading2).style.display = "none";
            document.querySelector(
                DOMElements.infectedCountryList
            ).style.display = "block";

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
            document.querySelector(DOMElements.summaryBox).style.display =
                "block";
            document.querySelector(DOMElements.tableHeader).innerText =
                "All Infected Countries";
        } else {
            document.querySelector(DOMElements.summaryBox).style.display =
                "none";
            document.querySelector(DOMElements.tableHeader).innerText =
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
            let countryName = row.querySelectorAll("td")[1].innerText;
            let countryData = processedInput[countryName];

            openModal(countryData, row.getAttribute("data-slug"));
        });
    });
};

openModal = (countryData, slug) => {
    let elem = document.querySelector(DOMElements.modal);
    let instance = M.Modal.init(elem);

    countryData = addCommas(countryData, [
        "TotalConfirmed",
        "NewConfirmed",
        "TotalDeaths",
        "NewDeaths",
        "TotalRecovered",
    ]);

    document.querySelector(DOMElements.modalCountryName).innerText =
        countryData.Country;
    document.querySelector(DOMElements.modalConfirmedCases).innerText =
        countryData.TotalConfirmed;
    document.querySelector(DOMElements.modalConfirmedToday).innerText =
        countryData.NewConfirmed;
    document.querySelector(DOMElements.modalAllDeaths).innerText =
        countryData.TotalDeaths;
    document.querySelector(DOMElements.modalAllDeathsToday).innerText =
        countryData.NewDeaths;
    document.querySelector(DOMElements.modalRecoveredPatients).innerText =
        countryData.TotalRecovered;

    document.querySelector(DOMElements.loading3).style.display = "block";

    axios
        .get(
            `https://api.covid19api.com/total/country/${slug}/status/confirmed`
        )
        .then((res) => {
            document.querySelector(DOMElements.loading3).style.display = "none";

            let chartData;
            chartData = processChartData(res.data, "Infected");
            let startingPoint = detectZero(res.data);

            let infectedChartData = processDailyInfectedChartData(chartData);

            let chartDailyElement = document.getElementById(
                DOMElements.modalCountryChartDailyId
            );
            chartDailyElement.parentNode.removeChild(chartDailyElement);

            document.querySelector(
                DOMElements.modalCountryChartDiv
            ).innerHTML += `<canvas id="${DOMElements.modalCountryChartDailyId}" width="300" height="300"></canvas>`;
            if (window.innerHeight < window.innerWidth) {
                document
                    .getElementById(DOMElements.modalCountryChartDailyId)
                    .setAttribute("height", 150);
            }
            let ctxDaily = document
                .getElementById(DOMElements.modalCountryChartDailyId)
                .getContext("2d");

            let chartDaily = createChartAndShowDaily(
                ctxDaily,
                infectedChartData,
                countryData.Country
            );

            let chartElement = document.getElementById(
                DOMElements.modalCountryChartId
            );
            chartElement.parentNode.removeChild(chartElement);

            document.querySelector(
                DOMElements.modalCountryChartDailyDiv
            ).innerHTML += `<canvas id="${DOMElements.modalCountryChartId}" width="300" height="300"></canvas>`;
            if (window.innerHeight < window.innerWidth) {
                document
                    .getElementById(DOMElements.modalCountryChartId)
                    .setAttribute("height", 150);
            }

            let ctx = document
                .getElementById(DOMElements.modalCountryChartId)
                .getContext("2d");

            let chart = createChartAndShowInfected(
                ctx,
                chartData,
                countryData.Country
            );

            axios
                .get(
                    `https://api.covid19api.com/total/country/${slug}/status/deaths`
                )
                .then((res) => {
                    chartData = processChartData(res.data, "", startingPoint);
                    chart = updateChart(chart, chartData, "Deaths", "#e51c23");

                    axios
                        .get(
                            `https://api.covid19api.com/total/country/${slug}/status/recovered`
                        )
                        .then((res) => {
                            chartData = processChartData(
                                res.data,
                                "",
                                startingPoint
                            );
                            chart = updateChart(
                                chart,
                                chartData,
                                "Recovered",
                                "#4caf50"
                            );
                        })
                        .catch((err_3) => console.log(err_3));
                })
                .catch((err_2) => console.log(err_2));
        })
        .catch((err_1) => console.log(err_1));

    instance.open();
};

detectZero = (chartData) => {
    let startingPoint = 0;
    let found = false;

    chartData.forEach((row, index, values) => {
        if (index > 0) {
            if (row.Cases !== 0 && values[index - 1].Cases === 0) {
                if (found === false) {
                    startingPoint = index;
                }
            }
        }
    });

    return startingPoint;
};

processChartData = (chartData, caseType = "", startingPoint = 0) => {
    let dataLabelPoints, dataLabels, processedData;
    dataLabelPoints = [];
    dataLabels = [];

    processedData = [];

    if (startingPoint === 0) {
        chartData.forEach((row) => {
            if (row.Cases !== 0 && caseType === "Infected") {
                processedData.push(row.Cases);
                dataLabels.push(row.Date.slice(0, 10));
            }
        });
    } else {
        for (let i = startingPoint; i < chartData.length; i++) {
            processedData.push(chartData[i].Cases);
            dataLabels.push(chartData[i].Date.slice(0, 10));
        }
    }

    return {
        dataPoints: processedData,
        dataLabels: dataLabels,
    };
};

processDailyInfectedChartData = (data) => {
    let retData = {
        dataLabels: [],
        dataPoints: [],
    };

    retData.dataLabels.push(data.dataLabels[0]);
    retData.dataPoints.push(data.dataPoints[0]);
    let newCase = 0;
    for (let i = 1; i < data.dataLabels.length; i++) {
        newCase = data.dataPoints[i] - data.dataPoints[i - 1];
        retData.dataLabels.push(data.dataLabels[i]);
        if (newCase < 0) {
            retData.dataPoints.push(0);
        } else {
            retData.dataPoints.push(newCase);
        }
    }

    return retData;
};

createChartAndShowInfected = (ctx, chartData, countryName) => {
    let chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.dataLabels,
            datasets: [
                {
                    data: chartData.dataPoints,
                    label: "Infected",
                    borderColor: "#ff9800",
                    fill: true,
                },
            ],
        },
        options: {
            title: {
                display: true,
                text: `COVID-19 contamination over time in ${countryName}`,
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

    return chart;
};

createChartAndShowDaily = (ctx, chartData, countryName) => {
    let chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartData.dataLabels,
            datasets: [
                {
                    data: chartData.dataPoints,
                    label: "Daily New Cases",
                    // borderColor: "#ff9800",
                    backgroundColor: "#ff9800",
                    hoverBackgroundColor: "#e51c23",
                    fill: true,
                },
            ],
        },
        options: {
            title: {
                display: true,
                text: `Daily new COVID-19 cases in ${countryName}`,
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

    return chart;
};

updateChart = (chart, chartData, labelName, labelColor) => {
    let newLine = {
        data: chartData.dataPoints,
        label: labelName,
        borderColor: labelColor,
        fill: false,
    };
    chart.data.datasets.push(newLine);
    chart.update();

    return chart;
};
