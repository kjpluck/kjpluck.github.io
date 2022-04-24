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
        seaIceData.title = "Antarctic Sea Ice " + type + " - NSIDC";
    else
        seaIceData.title = "Arctic Sea Ice " + type + " - NSIDC";

    var years = [];
    for (var i = 1979; i <= this.maxYear; i++) {
        years.push(i);
    }

    var done = years.length;
    var that = this;
    $(years).each(function(index, year) // Need to use a .each function as "year" needs a closure around it.
    {
        var number = this;
        $.getJSON("https://nsidc.org/api/seaiceservice/" + type.toLowerCase() + "/" + hemisphere + "/filled_averaged_data/" + year + "?index=doy&smoothing_window=2", function(data) {
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

DataLoader.prototype.dateFromDay = function(year, day){
    var date = new Date(year, 0); // initialize a date in `year-01-01`
    return (new Date(date.setDate(day))).toLocaleDateString(undefined, {year: "numeric", month: 'long', day: 'numeric' }); // add the number of days
  }

DataLoader.prototype.GotNsidc = function(seaIceData, callBack)
{
    var nsidcDataTable = new google.visualization.DataTable();
    
    nsidcDataTable.addColumn('number', 'Date');
    nsidcDataTable.series = [];
    nsidcDataTable.title = seaIceData.title;
    for(year = 1979; year <= this.maxYear; year++)
    {
        nsidcDataTable.addColumn('number', year);
        nsidcDataTable.addColumn({type:'string', role:'tooltip'});
        nsidcDataTable.series.push(this.MakeColor(year));
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
                row.push(this.dateFromDay(year, day+1) + "\n" + value + " Mkm\u00B2");
            }
            else
            {
                row.push(null);
                row.push("No data");
            }
                
        }
        nsidcDataTable.addRow(row);
    }

    callBack(nsidcDataTable);
}

DataLoader.prototype.MakeColor = function(year)
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
    
    var global = {title: "Global Sea Ice " + type + " - NSIDC"};
    
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

DataLoader.prototype.GetPiomas = function()
{
    $.getJSON("PIOMAS.vol.daily.1979."+this.maxYear+".Current.v2.1.dat", function(data) {
            console.log("Loaded");
        });
}

