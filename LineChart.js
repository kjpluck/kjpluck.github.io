google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

    DataLoader.GetNsidc(1979, 2018, GotNsidc);
    
}

function GotNsidc(data)
{
    var options = {
        chart: {
            title: 'Sea ice!',
            subtitle: 'in millions of square km'
        },
        colors: data.series,
        width: 900,
        height: 500
    };

    var chart = new google.charts.Line(document.getElementById('linechart_material'));

    chart.draw(data, google.charts.Line.convertOptions(options));
}