var cachedData = {};
var loadedData = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}}};
var dataTables = {North:{Extent:{},Area:{}},South:{Extent:{},Area:{}},Global:{Extent:{},Area:{}}};

function Data(){
}

Data.loadAllData = async function()
{
  cachedData = await loadCachedData();

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
  
  
  var googleDataTable = new google.visualization.DataTable();
  googleDataTable.title = monthName + " Average " + hemisphereTitles[hemisphere] + " Sea Ice " + areaType + " - NSIDC";
  
  googleDataTable.addColumn({type: "date", label: "Year"});
  googleDataTable.addColumn({type: "number", label: "Average"});
  googleDataTable.addColumn({type: "string", role: "tooltip"});

  googleDataTable.series = [{color:"#0000ff"}];

  let min = 10000;
  let max = 0;
  for(const yearKey in monthlyAverages)
  {
    if (!Object.hasOwn(monthlyAverages, yearKey)) continue;

    let year = yearKey.substring(4);
    let value = monthlyAverages[yearKey];
    let tooltip = monthName + " " + year + "\n" + value.toFixed(3) + " Mkm\u00B2";

    googleDataTable.addRow([new Date(year, 1, 1), value, tooltip]);

    if(value > max) max = value;
    if(value < min) min = value;
  }

  googleDataTable.range = {min: Math.round(min - 1), max: Math.round(max + 1)};
  
  dataTables[hemisphere][areaType][monthName] = googleDataTable;

}

function getMonthlyAverages(theMonth, dataCorrectionRequired, data1, data2)
{
  let startOfMonthInYear = 0;
  let lengthOfMonth = monthLengths[theMonth];

  for(let i = 0; i<theMonth; i++)
  {
    startOfMonthInYear += monthLengths[i];
  }

  let endOfMonthInYear = startOfMonthInYear + lengthOfMonth - 1;

  let monthlyAverages = {};

  for(const yearKey in data1)
  {
    if (!Object.hasOwn(data1, yearKey)) continue;
    if(yearKey == "title") continue;

    let avgAccumulator = 0.0;
    let count = 0;
    let average = 0;
    let year = yearKey.substring(4);
    let today = new Date();

    if(year == today.getFullYear() && theMonth == today.getMonth()+1) continue;

    let dataCorrection = 1.0;
    if(dataCorrectionRequired && year < 1988) dataCorrection = 1.1;

    for(let day = startOfMonthInYear; day <= endOfMonthInYear; day++)
    {
      if (!Object.hasOwn(data1[yearKey], day)) continue;
      if (data2 && !Object.hasOwn(data2[yearKey], day)) continue;

      let value1 = data1[yearKey][day];
      if(value1 == -1) continue;

      let value2 = 0;
      if(data2) value2 = data2[yearKey][day];
      if(value2 == -1) continue;

      avgAccumulator += (value1 * dataCorrection) + value2;
      count++;
    }


    if(count > 0)
    {
      average = avgAccumulator / count;
      monthlyAverages[yearKey] = average;
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
                        
            var dataLoaderWorker = new Worker("DataLoader.js");
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
    var globalWorker = new Worker("DataLoader.js");
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
    var globalWorker = new Worker("DataLoader.js");
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