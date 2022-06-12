google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(loadAllData);
var loadedData = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}}};
var dataTables = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}},Global:{Extent:{},Area:{}}};
var chart;
var theHemisphere;
var options = 
{
    animation:
    {
        duration: 1000,
        easing: 'out',
        startup: true
    },
    width: 900,
    height: 900,
    legend:{pageIndex:1},
    explorer:{ actions: ['dragToZoom', 'rightClickToReset'] },
    hAxis:
    {
        title: "Date"
    },
    vAxis:
    {
        title:"Extent (Millions of square kilometers)",
        viewWindow:
        {
            min: 10, max: 25
        },
        gridlines:{count:0}
    }
};

function loadAllData()
{
    var dataLoaderWorkers = [];
    var maxYear = (new Date()).getFullYear();

    ["Area", "Extent"].forEach(function(areaType){
        ["North", "South"].forEach(function(hemisphere){
            
            var locallyStoredJson = {};
            
            for(var year = 1979; year < maxYear; year++)
            {
                var localStorageKey = hemisphere + areaType + year;
                if(localStorage.hasOwnProperty(localStorageKey))
                {
                    locallyStoredJson[year] = localStorage.getItem(localStorageKey);
                }
            }

            var dataLoaderWorker = new Worker("DataLoader.js");
            dataLoaderWorkers.push(dataLoaderWorker);

            dataLoaderWorker.onmessage = function(e){
                if(e.data.complete)
                {
                    loadedData[hemisphere][areaType] = e.data.loadedData;
                    createGoogleDataTable(e.data.dataTable, areaType, hemisphere);
                    
                    var progressBar = document.getElementById(hemisphere+areaType+"ProgressTd");
                    progressBar.style.display = "none";

                    enableButton(areaType+"Annual"+hemisphere+"Button"); 
                    enableButton(areaType+"Minimum"+hemisphere+"Button"); 
                    enableButton(areaType+"Average"+hemisphere+"Button"); 
                    enableButton(areaType+"Maximum"+hemisphere+"Button");
                    return;
                }
        
                if(e.data.progressMax)
                {
                    var progressBar = document.getElementById(hemisphere+areaType+"Progress");
                    progressBar.max = e.data.progressMax;
                    progressBar.value = e.data.progressValue;
                }

                if(e.data.json)
                {
                    var localStorageKey = hemisphere + areaType + e.data.year;
                    localStorage.setItem(localStorageKey, e.data.json);
                }
            }

            dataLoaderWorker.postMessage({type:areaType, hemisphere:hemisphere, locallyStoredJson:locallyStoredJson});

        });
    });
}

function createGoogleDataTable(dataTable, areaType, hemisphere)
{
    ["annual", "minimum", "average", "maximum"].forEach(function(graphType){
        var googleDataTable = new google.visualization.DataTable();

        googleDataTable.title = dataTable[graphType].title;
        
        dataTable[graphType].columns.forEach(function(column){
            googleDataTable.addColumn(column);
        });

        googleDataTable.series = dataTable[graphType].series;

        dataTable[graphType].rows.forEach(function(row){
            googleDataTable.addRow(row);
        });

        dataTables[hemisphere][areaType][graphType] = googleDataTable;
    })
}

var enabledButtonCount = 0;
function enableButton(id)
{
    var button = document.getElementById(id);
    button.style.display = "block";

    enabledButtonCount++;
    if(enabledButtonCount == 16)
    {

        var globalWorker1 = new Worker("DataLoader.js");
        globalWorker1.onmessage = function(e){
            if(e.data.complete)
            {
                createGoogleDataTable(e.data.dataTable, "Area", "Global");
                enableButton("AreaAnnualGlobalButton"); 
                enableButton("AreaMinimumGlobalButton"); 
                enableButton("AreaAverageGlobalButton"); 
                enableButton("AreaMaximumGlobalButton");
                return;
            }
    
            var progressBar = document.getElementById(e.data.hemisphere+e.data.type+"Progress");
            if(progressBar)
            {
                progressBar.max = e.data.progressMax;
                progressBar.value = e.data.progressValue;
            }
        }
        globalWorker1.postMessage({type:"Area", hemisphere:"Global", northData: loadedData.North.Area, southData: loadedData.South.Area});

        
        var globalWorker2 = new Worker("DataLoader.js");
        globalWorker2.onmessage = function(e){
            if(e.data.complete)
            {
                createGoogleDataTable(e.data.dataTable, "Extent", "Global");
                enableButton("ExtentAnnualGlobalButton"); 
                enableButton("ExtentMinimumGlobalButton"); 
                enableButton("ExtentAverageGlobalButton"); 
                enableButton("ExtentMaximumGlobalButton");
                return;
            }
    
            var progressBar = document.getElementById(e.data.hemisphere+e.data.type+"Progress");
            if(progressBar)
            {
                progressBar.max = e.data.progressMax;
                progressBar.value = e.data.progressValue;
            }
        }
        globalWorker2.postMessage({type:"Extent", hemisphere:"Global", northData: loadedData.North.Extent, southData: loadedData.South.Extent});
    }
}


function drawChart(areaType, hemisphere, graphType) {
    if(!areaType)
        areaType = "Extent";
    if(!hemisphere)
        hemisphere = "North";

    theHemisphere = hemisphere;
    theType = areaType;

    var data = dataTables[hemisphere][areaType][graphType]
    if(graphType == "annual")
    {
        options.hAxis.ticks = [{v:1, f:"Jan"}, {v:32, f:"Feb"}, {v:60, f:"Mar"}, {v:91, f:"Apr"}, {v:121, f:"May"}, {v:152, f:"Jun"}, {v:182, f:"Jul"}, {v:213, f:"Aug"}, {v:244, f:"Sep"}, {v:274, f:"Oct"}, {v:305, f:"Nov"}, {v:335, f:"Dec"}, {v:367, f:"Jan"}]
    }
    else
    {
        options.hAxis.ticks = null;
    }

    var ranges = {
        Global:{
            Extent:{annual:{min:10, max:30}, average:{min:20, max:26}, minimum:{min:16, max:20}, maximum:{min:22, max:30}},
            Area:  {annual:{min:10, max:25}, average:{min:16, max:22}, minimum:{min:13, max:17}, maximum:{min:15, max:23}}
        },
        North: {
            Extent:{annual:{min:0,  max:18}, average:{min:9, max:13}, minimum:{min:0, max:8}, maximum:{min:14, max:17}},
            Area:  {annual:{min:0,  max:16}, average:{min:7, max:11}, minimum:{min:0, max:8}, maximum:{min:12, max:15}}
        },
        South: {
            Extent:{annual:{min:0,  max:22}, average:{min:9, max:13}, minimum:{min:0, max:8}, maximum:{min:18, max:21}},
            Area:  {annual:{min:0,  max:18}, average:{min:7, max:11}, minimum:{min:0, max:8}, maximum:{min:14, max:17}}
        }
    };

    options.vAxis.viewWindow.min = ranges[theHemisphere][theType][graphType].min;
    options.vAxis.viewWindow.max = ranges[theHemisphere][theType][graphType].max;

    if(theType == "Area")
        options.vAxis.title = "Area (Millions of square kilometers)";

    options.series = data.series;
    options.title = data.title;
    if(!chart)
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    chart.draw(data, options);
}
