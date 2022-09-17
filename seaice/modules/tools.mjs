function Tools()
{

}

Tools.removeFeb29 = function(data)
{
  // Replace all values from day 60 (Feb 29) to end of year
  // with the next day's value

  let maxYear = (new Date()).getFullYear();
  for (var year = 1979; year <= maxYear; year++)
  {
    if(!data.hasOwnProperty(year.toString())) continue;
    let thisYearsData = data[year];

    if(!thisYearsData.hasOwnProperty("366")) continue;

    for(let day = 60; day <= 365; day++)
    {
      thisYearsData[day] = thisYearsData[day+1];
    }

    delete thisYearsData["366"];
  }
}

Tools.toast = function(message) {
  var toastElement = document.getElementById("snackbar");
  toastElement.className = "show";
  toastElement.textContent = message;

  setTimeout(function(){ toastElement.className = toastElement.className.replace("show", ""); }, 3000);
}

export default Tools;