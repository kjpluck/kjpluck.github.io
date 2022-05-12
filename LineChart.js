google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(loadAllData);
var dataLoader = new DataLoader();
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
    dataLoader.GetNsidc("Extent", "north", function()
    {
        enableButton("ExtentAnnualArcticButton", "Annual"); 
        enableButton("ExtentMinimumArcticButton", "Min"); 
        enableButton("ExtentAverageArcticButton", "Avg"); 
        enableButton("ExtentMaximumArcticButton", "Max");
    });
    dataLoader.GetNsidc("Extent", "south", function()
    {
        enableButton("ExtentAnnualAntarcticButton", "Annual"); 
        enableButton("ExtentMinimumAntarcticButton", "Min"); 
        enableButton("ExtentAverageAntarcticButton", "Avg"); 
        enableButton("ExtentMaximumAntarcticButton", "Max");
    });
    dataLoader.GetNsidc("Area", "north", function()
    {
        enableButton("AreaAnnualArcticButton", "Annual"); 
        enableButton("AreaMinimumArcticButton", "Min"); 
        enableButton("AreaAverageArcticButton", "Avg"); 
        enableButton("AreaMaximumArcticButton", "Max");
    });
    dataLoader.GetNsidc("Area", "south", function()
    {
        enableButton("AreaAnnualAntarcticButton", "Annual"); 
        enableButton("AreaMinimumAntarcticButton", "Min"); 
        enableButton("AreaAverageAntarcticButton", "Avg"); 
        enableButton("AreaMaximumAntarcticButton", "Max");
    });
}

var enabledButtonCount = 0;
function enableButton(id, text)
{
    if(!text) text = "View";

    var button = document.getElementById(id);
    button.disabled = false;
    button.textContent = text;

    enabledButtonCount++;
    if(enabledButtonCount == 16)
    {
        dataLoader.GetNsidc("Extent", "global", function(){enableButton("ExtentAnnualGlobalButton", "Annual")});
        dataLoader.GetNsidc("Extent", "global", function(){enableButton("ExtentMinimumGlobalButton", "Min")});
        dataLoader.GetNsidc("Extent", "global", function(){enableButton("ExtentAverageGlobalButton", "Avg")});
        dataLoader.GetNsidc("Extent", "global", function(){enableButton("ExtentMaximumGlobalButton", "Max")});

        dataLoader.GetNsidc("Area", "global", function(){enableButton("AreaAnnualGlobalButton", "Annual")});
        dataLoader.GetNsidc("Area", "global", function(){enableButton("AreaMinimumGlobalButton", "Min")});
        dataLoader.GetNsidc("Area", "global", function(){enableButton("AreaAverageGlobalButton", "Avg")});
        dataLoader.GetNsidc("Area", "global", function(){enableButton("AreaMaximumGlobalButton", "Max")});
    }
}


function drawChart(areaType, hemisphere, graphType) {
    if(!areaType)
        areaType = "Extent";
    if(!hemisphere)
        hemisphere = "north";

    theHemisphere = hemisphere;
    theType = areaType;

    var data = dataLoader.LoadedData[areaType+hemisphere+graphType];
    if(graphType == "annual")
    {
        options.hAxis.ticks = [{v:1, f:"Jan"}, {v:32, f:"Feb"}, {v:60, f:"Mar"}, {v:91, f:"Apr"}, {v:121, f:"May"}, {v:152, f:"Jun"}, {v:182, f:"Jul"}, {v:213, f:"Aug"}, {v:244, f:"Sep"}, {v:274, f:"Oct"}, {v:305, f:"Nov"}, {v:335, f:"Dec"}, {v:367, f:"Jan"}]
    }
    else
    {
        options.hAxis.ticks = null;
    }

    var ranges = {
        global:{
            Extent:{annual:{min:10, max:30}, average:{min:20, max:26}, minimum:{min:16, max:20}, maximum:{min:22, max:30}},
            Area:  {annual:{min:10, max:25}, average:{min:16, max:22}, minimum:{min:13, max:17}, maximum:{min:15, max:23}}
        },
        north: {
            Extent:{annual:{min:0,  max:18}, average:{min:9, max:13}, minimum:{min:0, max:8}, maximum:{min:14, max:17}},
            Area:  {annual:{min:0,  max:16}, average:{min:7, max:11}, minimum:{min:0, max:8}, maximum:{min:12, max:15}}
        },
        south: {
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
