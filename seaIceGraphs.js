
import SeaIceUi from "./modules/SeaIceUi.mjs";
import Data from "./modules/data.mjs";
import {dataTables, monthNames} from "./modules/data.mjs"

google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(initialise);

var chart;
var options = 
{
    legend: 'none',
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


async function initialise()
{
  SeaIceUi.initialise(onUiClick);

  await Data.loadAllData();

  hidePleaseWait();

  drawChart("Extent", "Global", "annual")
}

function onUiClick()
{
  let state = SeaIceUi.getState();

  if(state.graphType == "month")
  {
    if(!dataTables[state.hemisphere][state.areaType][monthNames[state.month]])
      Data.calcMonthAverages(state.month, state.areaType, state.hemisphere);

    drawChart(state.areaType, state.hemisphere, monthNames[state.month]);
  }
  else
  {
    drawChart(state.areaType, state.hemisphere, state.graphType);
  }

}


function hidePleaseWait()
{
  var pw = document.getElementById("pleaseWait");
  pw.parentElement.removeChild(pw);
}

let lastGraphType = "annual";

function drawChart(areaType, hemisphere, graphType) {

  var dataTable = dataTables[hemisphere][areaType][graphType];

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
          Extent:{annual:{min:0,  max:18}, average:{min:8, max:16}, minimum:{min:2, max:10}, maximum:{min:12, max:20}},
          Area:  {annual:{min:0,  max:16}, average:{min:6, max:14}, minimum:{min:0, max:8 }, maximum:{min:10, max:18}}
      },
      South: {
          Extent:{annual:{min:0,  max:22}, average:{min:10, max:14}, minimum:{min:1, max:5}, maximum:{min:17, max:21}},
          Area:  {annual:{min:0,  max:18}, average:{min:7,  max:11}, minimum:{min:1, max:5}, maximum:{min:13, max:17}}
      }
  };

  if(dataTable.range)
  {
    options.vAxis.viewWindow.min = dataTable.range.min;
    options.vAxis.viewWindow.max = dataTable.range.max;
  }
  else
  {
    options.vAxis.viewWindow.min = ranges[hemisphere][areaType][graphType].min;
    options.vAxis.viewWindow.max = ranges[hemisphere][areaType][graphType].max;
  }

  options.vAxis.title = areaType + " (Millions of square kilometers)";

  options.series = dataTable.series;
  options.title = dataTable.title;

  if(graphType == "annual" || lastGraphType == "annual")
    options.animation = null;
  else
  {
    options.animation = 
    {
      duration: 1000,
      easing: 'out',
      startup: false
    } 
  }

  if(graphType == "annual")
  {
    options.legend = {pageIndex:1};
  }
  else
    options.legend = {position: 'none'};

  if(!chart)
  {
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  }

  chart.draw(dataTable, options);

  lastGraphType = graphType;
}
