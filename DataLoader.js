function DataLoader()
{

}

DataLoader.GetNsidc = function (startYear, endYear, callBack)
{   

        var years = [];
        for (var i = startYear; i <= endYear; i++) {
            years.push(i);
        }

        var done = years.length;
        var sum = 0;

        var seaIceData={};
        seaIceData.startYear = startYear;
        seaIceData.endYear = endYear;
        
        $(years).each(function(index, year) {
          var number = this;
          $.getJSON("http://nsidc.org/api/seaiceservice/extent/north/filled_averaged_data/" + year + "?index=doy&smoothing_window=5", function(data) {
            seaIceData["year" + year] = data;
            done -= 1;
            if(done == 0) DataLoader.GotNsidc(seaIceData, callBack);
          });
        });
}

DataLoader.GotNsidc = function(seaIceData, callBack)
{
    var nsidcDataTable = new google.visualization.DataTable();
    
    nsidcDataTable.addColumn('number', 'Day');
    nsidcDataTable.series = [];
    for(year = seaIceData.startYear; year <= seaIceData.endYear; year++)
    {
        nsidcDataTable.addColumn('number', year);
        nsidcDataTable.series.push(DataLoader.MakeColor(seaIceData, year));
    }

    for(day = 1; day<=366; day++)
    {
        var row = [];
        row.push(day+1);
        for(year = seaIceData.startYear; year <= seaIceData.endYear; year++)
        {
            if(seaIceData["year" + year][day])
            {
                var value = seaIceData["year" + year][day];
                if(value == -1)
                    value = null
                row.push(value);
            }
            else
                row.push(null);
        }
        nsidcDataTable.addRow(row);
    }

    callBack(nsidcDataTable);
}

DataLoader.MakeColor = function(seaIceData, year)
{
    var range = seaIceData.endYear - seaIceData.startYear;
    var pos = year - seaIceData.startYear;

    var lerp = 1 - pos / range;

    var rgb = 127 + Math.floor(lerp * 128);
    var hex = rgb.toString(16);
    return "#" + hex + hex + hex;
}