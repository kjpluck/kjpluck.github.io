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
    legend:"none",
    explorer:{},
    hAxis:
    {
        title: "Time",
        ticks: [{v:1, f:"Jan"}, {v:32, f:"Feb"}, {v:60, f:"Mar"}, {v:91, f:"Apr"}, {v:121, f:"May"}, {v:152, f:"Jun"}, {v:182, f:"Jul"}, {v:213, f:"Aug"}, {v:244, f:"Sep"}, {v:274, f:"Oct"}, {v:305, f:"Nov"}, {v:335, f:"Dec"}, {v:367, f:"Jan"}]
    },
    vAxis:
    {
        title:"Extent (Millions of square kilometers)",
        viewWindow:
        {
            min: 10, max: 25
        }
    }
};

function loadAllData()
{
    dataLoader.GetNsidc("Extent", "north", function(){enableButton("ExtentArcticButton")});
    dataLoader.GetNsidc("Extent", "south", function(){enableButton("ExtentAntarcticButton")});
    dataLoader.GetNsidc("Area", "north", function(){enableButton("AreaArcticButton")});
    dataLoader.GetNsidc("Area", "south", function(){enableButton("AreaAntarcticButton")});
}

var enabledButtonCount = 0;
function enableButton(id)
{
    var button = document.getElementById(id);
    button.disabled = false;
    button.textContent = "View";

    enabledButtonCount++;
    if(enabledButtonCount == 4)
    {
        enableButton("AreaGlobalButton");
        enableButton("ExtentGlobalButton");
    }
}


function drawChart(type, hemisphere) {
    if(!type)
        type = "Extent";
    if(!hemisphere)
        hemisphere = "north";

    theHemisphere = hemisphere;
    theType = type;

    dataLoader.GetNsidc(type, hemisphere, GotNsidc);
}

function GotNsidc(data)
{
    if(theHemisphere == "global")
    {
        if(theType == "Extent")
        {
            options.vAxis.viewWindow.min = 10;
            options.vAxis.viewWindow.max = 30;
        }
        else
        {
            options.vAxis.viewWindow.min = 10;
            options.vAxis.viewWindow.max = 25;
        }
    }
    else
    {
        if(theType == "Extent")
        {
            options.vAxis.viewWindow.min = 0;
            options.vAxis.viewWindow.max = 24;
        }
        else
        {
            options.vAxis.viewWindow.min = 0;
            options.vAxis.viewWindow.max = 18;
        }
    }

    if(theType == "Area")
        options.vAxis.title = "Area (Millions of square kilometers)";

    options.colors = data.series;
    options.title = data.title;
    if(!chart)
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    chart.draw(data, google.charts.Line.convertOptions(options));
}
