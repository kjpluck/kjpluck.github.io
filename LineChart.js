google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawChart);
var dataLoader = new DataLoader();
var hemisphere = "north";
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
    hAxis:{title: "time"},
    vAxis:
    {
        title:"Extent (Millions of square kilometers)",
        viewWindow:
        {
            min: 0, max: 30
        }
    }
};

function drawChart() {

    dataLoader.GetNsidc(hemisphere, 1979, 2018, GotNsidc);
    if(hemisphere == "north")
        hemisphere = "south"
    else
    if(hemisphere == "south")
        hemisphere = "global";
    else
    if(hemisphere == "global")
        hemisphere = "north";
}

function GotNsidc(data)
{
    options.colors = data.series;
    options.title = data.title;
    if(!chart)
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));

    chart.draw(data, google.charts.Line.convertOptions(options));
}