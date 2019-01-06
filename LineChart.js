google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawChart);
var dataLoader = new DataLoader();
var chart;
var options = {
    animation:{
        duration: 1000,
        easing: 'out',
        startup: true
        },
    width: 900,
    height: 900,
    legend:"none",
    hAxis:
    {
        title: "time",
        ticks: [{v:1, f:"Jan"}, {v:32, f:"Feb"}, {v:60, f:"Mar"}, {v:91, f:"Apr"}, {v:121, f:"May"}, {v:152, f:"Jun"}, {v:182, f:"Jul"}, {v:213, f:"Aug"}, {v:244, f:"Sep"}, {v:274, f:"Oct"}, {v:305, f:"Nov"}, {v:335, f:"Dec"}, {v:367, f:"Jan"}]
    },
    vAxis:
    {
        title:"Extent (Millions of square kilometers)",
        viewWindow:
        {
            min: 0, max: 30
        }
    }
};

function drawChart(type, hemisphere) {
    if(!type)
        type = "extent";
    if(!hemisphere)
        hemisphere = "north";

    dataLoader.GetNsidc(type, hemisphere, GotNsidc);
}

function GotNsidc(data)
{
    options.colors = data.series;
    options.title = data.title;
    if(!chart)
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    chart.draw(data, google.charts.Line.convertOptions(options));
}