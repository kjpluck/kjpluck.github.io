
import SeaIceUi from "./modules/SeaIceUi.mjs";
import Data from "./modules/data.mjs";
import {dataTables, monthNames} from "./modules/data.mjs"

var chart;
var options = 
{
  plugins:{
    legend: {
      display: false,
      position: "right"
    }
  },
  scales:
  {
    x:{display: true, title: {text:"Month"}, type: 'linear'},
    y:{display: true, title: {text:"Extent"}}
  },
  elements:
  {
    line:
    {
      borderWidth: 0
    }
  }
};

const xTicks = {d1:"Jan", d32:"Feb", d60:"Mar", d91:"Apr", d121:"May", d152:"Jun", d182:"Jul", d213:"Aug", d244:"Sep", d274:"Oct", d305:"Nov", d335:"Dec", d367:"Jan"};

function drawXTicks(val, index)
{
  const tickKey = "d" + index;
  return tickKey in xTicks ? xTicks[tickKey] : null;
}

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


const ranges = {
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

function drawChart(areaType, hemisphere, graphType) {

  var dataTable = dataTables[hemisphere][areaType][graphType];

  if(graphType == "annual")
  {
    //options.scales.x.ticks = {callback: drawXTicks};
  }
  else
  {
    //options.scales.x.ticks = null;
  }

  if(dataTable.range)
  {
    options.scales.y.min = dataTable.range.min;
    options.scales.y.max = dataTable.range.max;
  }
  else
  {
    options.scales.y.min = ranges[hemisphere][areaType][graphType].min;
    options.scales.y.max = ranges[hemisphere][areaType][graphType].max;
  }

  options.scales.y.title.text = areaType + " (Millions of square kilometers)";

  if(graphType == "annual" || lastGraphType == "annual")
    options.animation = false;
  else
  {
    options.animation = 
    {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  }

  options.plugins.legend.display = (graphType == "annual");
  
  const config =
  {
    type: "line",
    data: dataTable,
    options: options
  };

  if(!chart)
  {
    chart = new Chart(document.getElementById('chart_canvas'), config);
  }
  else
  {
    chart.options = config.options;
    chart.data = config.data;
    chart.update();
  }

  lastGraphType = graphType;
}

await initialise();