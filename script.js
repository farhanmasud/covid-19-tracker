console.log("Initiating");

axios
    .get("https://api.covid19api.com/countries")
    .then(res => resProcess(res))
    .catch(err => console.log(err));

resProcess = res => {
    console.log(res.status);
    console.log(res.data.length);
    console.log(res.data[0]);
};
