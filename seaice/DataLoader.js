import Tools from "./modules/tools.mjs";

const maxYear = (new Date()).getUTCFullYear();


onmessage = function(e){
    if(!e.data.hemisphere) return;
    if(e.data.hemisphere == "Global") 
    {
        GetGlobal(e.data.type, e.data.northData, e.data.southData);
        return;
    }

    GetNsidc(e.data.type, e.data.hemisphere, e.data.cachedData);
}

function GetNsidc(type, hemisphere, cachedData)
{   

    if(hemisphere == "Global")
    {
        this.GetGlobal(type);
        return;
    }

    var seaIceData={};

    if(hemisphere == "South")
        seaIceData.title = "Antarctic Sea Ice " + type + " - NSIDC";
    else
        seaIceData.title = "Arctic Sea Ice " + type + " - NSIDC";

    var years = [];
    for (var i = 1979; i <= maxYear; i++) {
        years.push(i);
    }

    var done = years.length;

    var appendData = function(data, year)
    {
        seaIceData[year] = data;

        done -= 1;
        if(done == 0) 
        {
            GotNsidc(seaIceData, type, hemisphere);
        }
    }

    var reqListener = function(e,year)
    {
        postMessage({year:year, json:e.target.responseText});
        appendData(JSON.parse(e.target.responseText), year);
    }

    years.forEach(function(year){

        if(cachedData && cachedData[year])
        {
            appendData(cachedData[year], year);
            return;
        }

        var smoothingWindow = 2;
        if(year < 1988)
        {
            smoothingWindow = 7;
        }

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function(e){reqListener(e, year)});
        oReq.open("GET", "https://nsidc.org/api/seaiceservice/" + type.toLowerCase() + "/" + hemisphere.toLowerCase() + "/filled_averaged_data/" + year + "?index=doy&smoothing_window=" + smoothingWindow);
        
        oReq.send();
    });
}

function dateFromDay(year, day){
    var date = new Date(year, 0); // initialize a date in `year-01-01`
    return (new Date(date.setDate(day))).toLocaleDateString(undefined, {year: "numeric", month: 'long', day: 'numeric' }); // add the number of days
  }

function GotNsidc(seaIceData, type, hemisphere)
{    
    Tools.removeFeb29(seaIceData);

    var dataTable = {
        annual:{
            title:"",
            datasets:[]
        },
        
        minimum:{
            title: "Minimum " + seaIceData.title,
            datasets:[
                {
                    id: "minimum"+type+hemisphere,
                    data:[]
                }
            ]
        },
        
        average:{
            title: "Average " + seaIceData.title,
            datasets:[
                {
                    id: "average"+type+hemisphere,
                    data:[]
                }
            ]
        },
        
        maximum:{
            title: "Maximum " + seaIceData.title,
            datasets:[
                {
                    id: "maximum"+type+hemisphere,
                    data:[]
                }
            ]
        }
    };

    function processData(year)
    {
        var toReturn = [];

        var dataCorrection = 1.0;
        if(year < 1988 && hemisphere == "North" && type == "Area")
        {
            dataCorrection = 1.1;
        }

        let avgAccumulator = 0;
        let avgCount = 0;
        let minimum = 100000;
        let maximum = 0;

        for(let day = 1; day<=366; day++)
        {
            if(seaIceData[year][day])
            {
                var value = seaIceData[year][day];
                if(value == -1)
                    value = null
                
                if(value)
                {
                    value *= dataCorrection;
                    avgAccumulator += value;
                    avgCount++;
                    if(value < minimum)
                    {
                        minimum = value;
                    }
                    if(value > maximum)
                    {
                        maximum = value;
                    }
                }

                toReturn.push({x:day, y:value});
            }
            else
            {
                toReturn.push({x:day, y:null});
            }
        }

        if(year < maxYear) dataTable.average.datasets[0].data.push({x:year, y:avgAccumulator / avgCount});
        if(pastThisYearsExpectedMaximumDay(year, avgCount, hemisphere)) dataTable.maximum.datasets[0].data.push({x:year, y:maximum});
        if(pastThisYearsExpectedMinimumDay(year, avgCount, hemisphere)) dataTable.minimum.datasets[0].data.push({x:year, y:minimum});

        return toReturn;
    }

    dataTable.annual.title = seaIceData.title;

    for(let year = 1979; year <= maxYear; year++)
    {        
        dataTable.annual.datasets.push(
        {
            id: year,
            type: IsRecordLowYear(hemisphere, year, type) ? "record low year" : year == maxYear ? "current year" : "normal year",
            data: processData(year)
        });
    }
    
    postMessage({complete:true, dataTable:dataTable, loadedData: seaIceData});
}


const minimumDOY = {North:270, South:70, Global: 60};
const maximumDOY = {North:90, South:290, Global: 320};

const DOY = dayOfYear(new Date());

function dayOfYear(date){
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

function pastThisYearsExpectedMinimumDay(year, day, hemisphere)
{
    return year < maxYear || (year == maxYear && day >= minimumDOY[hemisphere]);
}

function pastThisYearsExpectedMaximumDay(year, day, hemisphere)
{
    return year < maxYear || (year == maxYear && day >= maximumDOY[hemisphere]);
}

function IsRecordLowYear(hemisphere, year, type)
{
    if(hemisphere == "North" && year == 2012)
        return true;

    if(hemisphere == "South" && year == 2022)
        return true;

    if(hemisphere == "Global" && year == 2017 && type == "Area")
        return true;

    if(hemisphere == "Global" && year == 2018 && type == "Extent")
        return true;

    return false;
}

function GetGlobal(type, northData, southData)
{
    
    var global = {title: "Global Sea Ice " + type + " - NSIDC"};
    
    for(let year = 1979; year <= maxYear; year++)
    {
        var dataCorrection = 1.0;
        if(year < 1988 && type == "Area")
        {
            dataCorrection = 1.1;
        }

        var northYearData = northData[year];
        var southYearData = southData[year];
        global[year] = {};
        for(let day = 0; day < 366; day++)
        {
            if(northYearData[day] == -1 || southYearData[day] == -1)
            {
                global[year][day] = null;
                continue;
            }

            global[year][day] = northYearData[day] * dataCorrection + southYearData[day];
        }
    }

    GotNsidc(global, type, "Global");
    
}


