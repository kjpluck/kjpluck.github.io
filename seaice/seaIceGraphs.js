import * as d3 from "https://cdn.skypack.dev/d3@7";
import SeaIceUi from "./modules/SeaIceUi.mjs";
import Data from "./modules/data.mjs";
import KevChart from "./modules/KevChart.mjs";
import {dataTables, monthNames} from "./modules/data.mjs"

var chart;
var options = 
{
  axes:
  {
    x:{title: "Month"},
    y:{title: "Extent"}
  }
};

const xTicks = {1:"Jan", 32:"Feb", 60:"Mar", 91:"Apr", 121:"May", 152:"Jun", 182:"Jul", 213:"Aug", 244:"Sep", 274:"Oct", 305:"Nov", 335:"Dec", 367:"Jan"};

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
      Extent:{annual:{min:14, max:30}, average:{min:20, max:26}, minimum:{min:16, max:20}, maximum:{min:22, max:30}},
      Area:  {annual:{min:12, max:24}, average:{min:16, max:22}, minimum:{min:13, max:17}, maximum:{min:15, max:23}}
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
    options.axes.y.min = dataTable.range.min;
    options.axes.y.max = dataTable.range.max;
  }
  else
  {
    options.axes.y.min = ranges[hemisphere][areaType][graphType].min;
    options.axes.y.max = ranges[hemisphere][areaType][graphType].max;
  }

  options.axes.y.title = areaType + " (Millions of square kilometers)";

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

  const config =
  {
    data: dataTable,
    options: options
  };

  if(!chart)
  {
    chart = new KevChart(document.getElementById('chart_div'), config);
  }
  else
  {
    chart.config = config;
    chart.update();
  }

  lastGraphType = graphType;
}

await initialise();