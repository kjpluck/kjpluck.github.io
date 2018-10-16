function DataLoader()
{
    this.north;
    this.south;
    this.global;
}

DataLoader.prototype.GetNsidc = function (hemisphere, startYear, endYear, callBack)
{   

    if(this[hemisphere])
    {
        DataLoader.GotNsidc(this[hemisphere], callBack);
        return;
    }

    if(hemisphere == "global")
    {
        this.GetGlobal(callBack);
        return;
    }

    var years = [];
    for (var i = startYear; i <= endYear; i++) {
        years.push(i);
    }

    var done = years.length;
    var sum = 0;

    var seaIceData={};

    if(hemisphere == "south")
        seaIceData.title = "Antarctic Sea Ice Extent";
    else
        seaIceData.title = "Arctic Sea Ice Extent";

    seaIceData.startYear = startYear;
    seaIceData.endYear = endYear;
    var that = this;
    $(years).each(function(index, year) {
        var number = this;
        $.getJSON("http://nsidc.org/api/seaiceservice/extent/"+hemisphere+"/filled_averaged_data/" + year + "?index=doy&smoothing_window=5", function(data) {
        seaIceData["year" + year] = data;
        done -= 1;
        if(done == 0) 
        {
            this[hemisphere] = seaIceData;
            DataLoader.GotNsidc(seaIceData, callBack);
        }
        }.bind(that));
    });
}

DataLoader.GotNsidc = function(seaIceData, callBack)
{
    var nsidcDataTable = new google.visualization.DataTable();
    
    nsidcDataTable.addColumn('number', 'Day');
    nsidcDataTable.series = [];
    nsidcDataTable.title = seaIceData.title;
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
    if(year == seaIceData.endYear)
        return "#ff0000";

    var range = seaIceData.endYear - seaIceData.startYear;
    var pos = year - seaIceData.startYear;

    var lerp = 1 - pos / range;

    var rgb = 127 + Math.floor(lerp * 100);
    var hex = rgb.toString(16);
    return "#" + hex + hex + hex;
}

DataLoader.prototype.GetGlobal = function(callBack)
{
    if(!this.north || !this.south)
        return;
    
    if(this.global)
    {
        DataLoader.GotNsidc(global, callBack);
        return;
    }
    
    var global = {title: "Global Sea Ice Extent", startYear:this.north.startYear, endYear:this.north.endYear};
    
    for(year = global.startYear; year <= global.endYear; year++)
    {
        var northData = this.north["year"+year];
        var southData = this.south["year"+year];
        global["year"+year] = {};
        for(day = 1; day <= 366; day++)
        {
            if(northData[day] == -1 || southData[day] == -1)
            {
                global["year" + year][day] = null;
                continue;
            }

            global["year"+year][day] = northData[day] + southData[day];
        }
    }

    this.global = global;
    DataLoader.GotNsidc(global, callBack);
}