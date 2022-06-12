var maxYear = (new Date()).getFullYear();

onmessage = function(e){
    if(!e.data.hemisphere) return;
    if(e.data.hemisphere == "Global") 
    {
        GetGlobal(e.data.type, e.data.northData, e.data.southData);
        return;
    }

    GetNsidc(e.data.type, e.data.hemisphere, e.data.locallyStoredJson);
}

function GetNsidc(type, hemisphere, locallyStoredJson)
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
    for (var i = 1979; i <= this.maxYear; i++) {
        years.push(i);
    }

    var done = years.length;

    var appendData = function(dataJson, year)
    {
        seaIceData["year" + year] = JSON.parse(dataJson);

        postMessage({progressMax:years.length, progressValue:years.length - done, type:type, hemisphere:hemisphere});

        done -= 1;
        if(done == 0) 
        {
            GotNsidc(seaIceData, type, hemisphere);
        }
    }

    var reqListener = function(e,year)
    {
        postMessage({year:year, json:e.target.responseText});
        appendData(e.target.responseText, year);
    }

    years.forEach(function(year){

        if(locallyStoredJson && locallyStoredJson[year])
        {
            appendData(locallyStoredJson[year], year);
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
    var dataTable = {
        annual:{
            title:"",
            columns:[],
            series:[],
            rows:[]
        },
        
        minimum:{
            title:"",
            columns:[],
            series:[],
            rows:[]
        },
        
        average:{
            title:"",
            columns:[],
            series:[],
            rows:[]
        },
        
        maximum:{
            title:"",
            columns:[],
            series:[],
            rows:[]
        }
    };

    dataTable.annual.columns.push({type:"number", label:"Date"});

    dataTable.annual.title = seaIceData.title;
    var avgAccumulator = {};
    var avgCount = {};
    var minimums = {};
    var maximums = {};
    for(year = 1979; year <= this.maxYear; year++)
    {
        dataTable.annual.columns.push({type:"number", label: year + (IsRecordLowYear(hemisphere, year, type) ? " Minimum" : "")});
        dataTable.annual.columns.push({type:'string', role:'tooltip'});
        dataTable.annual.series.push(this.MakeColor(year, hemisphere, type));
        avgAccumulator[year] = 0;
        avgCount[year] = 0;
        minimums[year] = 100000;
        maximums[year] = 0;
    }



    for(day = 1; day<=366; day++)
    {
        var row = [];
        row.push(day+1);
        for(year = 1979; year <= this.maxYear; year++)
        {
            var dataCorrection = 1.0;
            if(year < 1988 && hemisphere == "North" && type == "Area")
            {
                dataCorrection = 1.1;
            }

            if(seaIceData["year" + year][day])
            {
                var value = seaIceData["year" + year][day];
                if(value == -1)
                    value = null
                row.push(value);
                if(value)
                {
                    value *= dataCorrection;
                    avgAccumulator[year] = avgAccumulator[year]+value;
                    avgCount[year] = avgCount[year] + 1;
                    if(value < minimums[year])
                    {
                        minimums[year] = value;
                    }
                    if(value > maximums[year])
                    {
                        maximums[year] = value;
                    }
                }

                if(value == null)
                    row.push(this.dateFromDay(year, day+1));
                else
                    row.push(this.dateFromDay(year, day+1) + "\n" + value.toFixed(3) + " Mkm\u00B2");
            }
            else
            {
                row.push(null);
                row.push("No data");
            }
        }
        dataTable.annual.rows.push(row);
    }


    dataTable.average.title = "Average " + seaIceData.title;
    dataTable.average.series = [{color:"#ff0000"}];
    dataTable.average.columns.push({type:"date", label:"Year"});
    dataTable.average.columns.push({type:"number", label:"Average"});
    dataTable.average.columns.push({type:"string", role:"tooltip"});

    for(year = 1979; year <= this.maxYear-1; year++)
    {
        var row = [];
        row.push(new Date(year,1,1));
        
        var value = 0;

        if(avgCount[year] != 0)
            value = avgAccumulator[year] / avgCount[year];
        
        row.push(value);
        
        row.push(year + "\n" + value.toFixed(3) + " Mkm\u00B2");
        dataTable.average.rows.push(row);
    }

    dataTable.minimum.title = "Minimum " + seaIceData.title;
    dataTable.minimum.series.series = [{color:"#ff0000"}];
    dataTable.minimum.columns.push({type:"date", label:"Year"});
    dataTable.minimum.columns.push({type:"number", label:"Minimum"});
    dataTable.minimum.columns.push({type:"string", role:"tooltip"});

    for(year = 1979; year <= this.maxYear-1; year++)
    {
        var row = [];
        row.push(new Date(year,1,1));

        var value = 0;

        if(avgCount[year] != 0)
            value = minimums[year];
        
        row.push(value);
        
        row.push(year + "\n" + value.toFixed(3) + " Mkm\u00B2");

        dataTable.minimum.rows.push(row);
    }

    if((hemisphere == "South" && currentDayOfYear() > 70) || (hemisphere == "North" && currentDayOfYear() > 274))
    {
        var row = [];
        row.push(new Date(this.maxYear,1,1));

        var value = 0;

        if(avgCount[this.maxYear] != 0)
            value = minimums[this.maxYear];
        
        row.push(value);
        
        row.push(this.maxYear + "\n" + value.toFixed(3) + " Mkm\u00B2");

        dataTable.minimum.rows.push(row);
    }



    dataTable.maximum.title = "Maximum " + seaIceData.title;
    dataTable.maximum.series = [{color:"#ff0000"}];
    dataTable.maximum.columns.push({type:"date", label:"Year"});
    dataTable.maximum.columns.push({type:"number", label:"Maximum"});
    dataTable.maximum.columns.push({type:"string", role:"tooltip"});

    for(year = 1979; year <= this.maxYear-1; year++)
    {
        var row = [];
        row.push(new Date(year,1,1));

        var value = 0;

        if(avgCount[year] != 0)
            value = maximums[year];
        
        row.push(value);
        
        row.push(year + "\n" + value.toFixed(3) + " Mkm\u00B2");

        dataTable.maximum.rows.push(row);
    }

    
    if((hemisphere == "South" && currentDayOfYear() > 294) || (hemisphere == "North" && currentDayOfYear() > 105))
    {
        var row = [];
        row.push(new Date(this.maxYear,1,1));

        var value = 0;

        if(avgCount[this.maxYear] != 0)
            value = maximums[this.maxYear];
        
        row.push(value);
        
        row.push(this.maxYear + "\n" + value.toFixed(3) + " Mkm\u00B2");

        dataTable.maximum.rows.push(row);
    }

    postMessage({complete:true, dataTable:dataTable, loadedData: seaIceData});
}

function currentDayOfYear()
{
    var now = new Date(); var y=now.getFullYear(); var m=now.getMonth();
    return m*31-(m>1?(1054267675>>m*3-6&7)-(y&3||!(y%25)&&y&15?0:1):0)+now.getDate(); 
};

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

function MakeColor(year, hemisphere, type)
{
    if(IsRecordLowYear(hemisphere, year, type))
        return {color: "#ff0000", lineWidth: 3};

    if(year == this.maxYear)
        return {color: "#0000ff", lineWidth: 3};

    var range = this.maxYear - 1979;
    var pos = year - 1979;

    var lerp = 1 - pos / range;

    var rgb = 150 + Math.floor(lerp * 100);
    var hex = rgb.toString(16);
    return {color:"#" + hex + hex + hex};
}

function GetGlobal(type, northData, southData)
{
    
    var global = {title: "Global Sea Ice " + type + " - NSIDC"};
    
    for(year = 1979; year <= maxYear; year++)
    {
        var dataCorrection = 1.0;
        if(year < 1988 && type == "Area")
        {
            dataCorrection = 1.1;
        }

        var northYearData = northData["year"+year];
        var southYearData = southData["year"+year];
        global["year"+year] = {};
        for(day = 1; day <= 366; day++)
        {
            if(northYearData[day] == -1 || southYearData[day] == -1)
            {
                global["year" + year][day] = null;
                continue;
            }

            global["year"+year][day] = northYearData[day] * dataCorrection + southYearData[day];
        }
    }

    GotNsidc(global, type, "Global");
    
}


