import Tools from "./tools.mjs";

var cachedData = {};
var loadedData = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}}};
var dataTables = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}},Global:{Extent:{},Area:{}}};
const maxYear = (new Date()).getFullYear();

function Data(){
}

Data.loadAllData = async function()
{
  cachedData = await loadCachedData();

  let hemispheres = ["North", "South"];
  let areaTypes = ["Extent", "Area"];

  hemispheres.forEach
  (
    hemisphere => areaTypes.forEach
    (
      areaType => Tools.removeFeb29(cachedData[hemisphere][areaType])
    )
  );

  await loadFreshData();

  await generateGlobalData();

}

const monthLengths = [0,31,28,31,30,31,30,31,31,30,31,30,31];
const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const hemisphereTitles = {"North":"Arctic", "South":"Antarctic", "Global":"Global"};

Data.calcMonthAverages = function(theMonth, areaType, hemisphere)
{

  let monthName = monthNames[theMonth];
  let dataCorrectionRequired = (hemisphere == "North" || hemisphere == "Global") && areaType == "Area";

  let monthlyAverages = {};
  if(hemisphere == "Global")
  {
    let northData = loadedData["North"][areaType];
    let southData = loadedData["South"][areaType];
    monthlyAverages = getMonthlyAverages(theMonth, dataCorrectionRequired, northData, southData);
  }
  else
  {
    let data = loadedData[hemisphere][areaType];
    monthlyAverages = getMonthlyAverages(theMonth, dataCorrectionRequired, data);
  }
  
  
  const title = monthName + " Average " + hemisphereTitles[hemisphere] + " Sea Ice " + areaType + " - NSIDC";
  let data = [{x: 1978, y:null}]; // Add empty year at start to pad the chart
  let min = 10000;
  let max = 0;
  for(const year in monthlyAverages)
  {
    if (!Object.hasOwn(monthlyAverages, year)) continue;

    const value = monthlyAverages[year];

    data.push({x:year, y:value});

    if(value > max) max = value;
    if(value < min) min = value;
  }

  const range = {min: Math.round(min - 1), max: Math.round(max + 1)};
  const id = `average${monthName}${areaType}${hemisphere}`;
  
  dataTables[hemisphere][areaType][monthName] = {title: title, range: range, datasets: [{id: id, data: data}]};

}

function getMonthlyAverages(theMonth, dataCorrectionRequired, data1, data2)
{
  let startOfMonthInYear = 0;
  let lengthOfMonth = monthLengths[theMonth];

  for(let i = 0; i<theMonth; i++)
  {
    startOfMonthInYear += monthLengths[i];
  }

  startOfMonthInYear++; // So it's the 1st of the the month

  let endOfMonthInYear = startOfMonthInYear + lengthOfMonth - 1;

  let monthlyAverages = {};

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth()+1;

  for(const year in data1)
  {
    if (!Object.hasOwn(data1, year)) continue;
    if(year == "title") continue;

    let avgAccumulator = 0.0;
    let count = 0;
    let average = 0;

    if(year == thisYear && theMonth == thisMonth) continue;

    let dataCorrection = 1.0;
    if(dataCorrectionRequired && year < 1988) dataCorrection = 1.1;

    for(let day = startOfMonthInYear; day <= endOfMonthInYear; day++)
    {
      if (!Object.hasOwn(data1[year], day)) continue;
      if (data2 && !Object.hasOwn(data2[year], day)) continue;

      let value1 = data1[year][day];
      if(value1 == -1) continue;

      let value2 = 0;
      if(data2) value2 = data2[year][day];
      if(value2 == -1) continue;

      avgAccumulator += (value1 * dataCorrection) + value2;
      count++;
    }


    if(count > 0)
    {
      average = avgAccumulator / count;
      monthlyAverages[year] = average;
    }
  }

  return monthlyAverages;
}

function loadCachedData()
{
  return new Promise((resolve)=>{
    fetch("./cachedData.json")
      .then((response)=>response.json())
      .then((data)=>{
        resolve(data);
      });
  });
}


function loadFreshData()
{
  return new Promise(resolve => {
    var dataLoaderWorkers = [];
    let loadedCount = 0;

    ["Area", "Extent"].forEach(function(areaType){
        ["North", "South"].forEach(function(hemisphere){
                        
            var dataLoaderWorker = new Worker("DataLoader.js", {type: "module"});
            dataLoaderWorkers.push(dataLoaderWorker);

            dataLoaderWorker.onmessage = function(e){
                if(e.data.complete)
                {
                    loadedData[hemisphere][areaType] = e.data.loadedData;
                    splitDataTable(e.data.dataTable, areaType, hemisphere);
                    
                    loadedCount++;
                    if(loadedCount == 4)
                      resolve();
                      
                    return;
                }
            }

            dataLoaderWorker.postMessage({type:areaType, hemisphere:hemisphere, cachedData:cachedData[hemisphere][areaType]});

        });
    });
  });
}

function splitDataTable(dataTable, areaType, hemisphere)
{
    ["annual", "minimum", "average", "maximum"].forEach(function(graphType){
        dataTables[hemisphere][areaType][graphType] = dataTable[graphType];
    })
}

function generateGlobalData()
{
  const p1 = new Promise(resolve=>{
    var globalWorker = new Worker("DataLoader.js", {type: "module"});
    globalWorker.onmessage = function(e){
        if(e.data.complete)
        {
            splitDataTable(e.data.dataTable, "Area", "Global");
            resolve();
            return;
        }
    }
    globalWorker.postMessage({type:"Area", hemisphere:"Global", northData: loadedData.North.Area, southData: loadedData.South.Area});
  });
  
  const p2 = new Promise(resolve=>{
    var globalWorker = new Worker("DataLoader.js", {type: "module"});
    globalWorker.onmessage = function(e){
        if(e.data.complete)
        {
            splitDataTable(e.data.dataTable, "Extent", "Global");
            resolve();
            return;
        }
    }
    globalWorker.postMessage({type:"Extent", hemisphere:"Global", northData: loadedData.North.Extent, southData: loadedData.South.Extent});
  });

  return Promise.all([p1, p2]);
}

export {dataTables, monthNames};
export default Data;