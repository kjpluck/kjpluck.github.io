function DataLoader()
{
    this.north = {};
    this.south = {};
    this.global = {};
    this.maxYear = (new Date()).getFullYear();
}

DataLoader.prototype.GetNsidc = function (type, hemisphere, callBack)
{   

    if(this[hemisphere][type])
    {
        this.GotNsidc(this[hemisphere][type], callBack);
        return;
    }

    if(hemisphere == "global")
    {
        this.GetGlobal(type, callBack);
        return;
    }

    var sum = 0;

    var seaIceData={};

    if(hemisphere == "south")
        seaIceData.title = "Antarctic Sea Ice " + type;
    else
        seaIceData.title = "Arctic Sea Ice " + type;

    var years = [];
    for (var i = 1979; i <= this.maxYear; i++) {
        years.push(i);
    }

    var done = years.length;
    var that = this;
    $(years).each(function(index, year) // Need to use a .each function as "year" needs a closure around it.
    {
        var number = this;
        $.getJSON("http://nsidc.org/api/seaiceservice/" + type.toLowerCase() + "/" + hemisphere + "/filled_averaged_data/" + year + "?index=doy&smoothing_window=5", function(data) {
            seaIceData["year" + year] = data;
            done -= 1;
            if(done == 0) 
            {
                this[hemisphere][type] = seaIceData;
                this.GotNsidc(seaIceData, callBack);
            }
        }.bind(that));
    });
}

DataLoader.prototype.GotNsidc = function(seaIceData, callBack)
{
    var nsidcDataTable = new google.visualization.DataTable();
    
    nsidcDataTable.addColumn('number', 'Day');
    nsidcDataTable.series = [];
    nsidcDataTable.title = seaIceData.title;
    for(year = 1979; year <= this.maxYear; year++)
    {
        nsidcDataTable.addColumn('number', year);
        nsidcDataTable.series.push(this.MakeColor(seaIceData, year));
    }

    for(day = 1; day<=366; day++)
    {
        var row = [];
        row.push(day+1);
        for(year = 1979; year <= this.maxYear; year++)
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

DataLoader.prototype.MakeColor = function(seaIceData, year)
{
    if(year == this.maxYear)
        return "#ff0000";

    var range = this.maxYear - 1979;
    var pos = year - 1979;

    var lerp = 1 - pos / range;

    var rgb = 127 + Math.floor(lerp * 100);
    var hex = rgb.toString(16);
    return "#" + hex + hex + hex;
}

DataLoader.prototype.GetGlobal = function(type, callBack)
{
    if(!this.north || !this.south)
        return;
    
    if(this.global[type])
    {
        this.GotNsidc(global[type], callBack);
        return;
    }
    
    var global = {title: "Global Sea Ice " + type};
    
    for(year = 1979; year <= this.maxYear; year++)
    {
        var northData = this.north[type]["year"+year];
        var southData = this.south[type]["year"+year];
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

    this.global[type] = global;
    this.GotNsidc(global, callBack);
}
