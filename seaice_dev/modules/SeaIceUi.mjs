import Tools from "./tools.mjs";

function SeaIceUi(){}

SeaIceUi.initialise = function(doclick){
  addClickToAllInputs(doclick);
  addKeyEvent();
}


function addClickToAllInputs(doclick)
{
  let theInputs = document.querySelectorAll("input[type=radio][name='hemisphere'], input[type=radio][name='areaType']");

  theInputs.forEach(theInput => {
      theInput.onclick = doclick;
  });

  theInputs = document.querySelectorAll("input[type=radio][name='graphType']");

  theInputs.forEach(theInput => {
    theInput.onclick = function()
    {
      clearMonthSelector();
      doclick();
    }
  });


  const monthSelector = document.querySelectorAll("input[type=radio][name='month']");
  monthSelector.forEach(input => {
    input.onchange = function()
    {
      document.getElementById("Month").checked = true;
      doclick();
    }
  });
  

  let theCopyButton = document.getElementById("CopyButton");
  theCopyButton.onclick = copyGraphToClipboard;

  if(isSafari())
    Tools.toast("Safari detected. V3")
}


function clearMonthSelector()
{
  const monthSelector = document.querySelectorAll("input[type=radio][name='month']");
  monthSelector.forEach(input => {
    input.checked = false;
  })

}

function addKeyEvent()
{
  document.addEventListener("keydown", handleKeyDown);
}

function handleKeyDown(e)
{
  if(e.repeat) return;

  if(e.key == "c" && e.ctrlKey)
    copyGraphToClipboard();
}

function makeObjectFromFormData(formData){
  var toReturn = {};
  for(const pair of formData.entries()){
      toReturn[pair[0]] = pair[1];
  }
  return toReturn;
}

SeaIceUi.getState = function()
{
  var theForm = document.getElementById("seaIceForm");
  var formData = new FormData(theForm);

  let state = makeObjectFromFormData(formData);

  return state;
}

function getSvgString(svgElement)
{
  let svgElementClone = svgElement.cloneNode(true);

  var svgString = (new XMLSerializer()).serializeToString(svgElementClone);

  return svgString;
}

function copyGraphToClipboard()
{
  if(typeof ClipboardItem == "undefined")
  {
    Tools.toast("Unable to copy chart on this browser/device.");
    return;
  }

  let svgElement = document.getElementsByTagName("svg")[0];
  let svgString = getSvgString(svgElement);

  var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});

  var DOMURL = window.URL || window.webkitURL || window;
  var objectUrl = DOMURL.createObjectURL(svgBlob);

  var canvas = document.createElement("canvas");

  canvas.width = svgElement.attributes.width.value;
  canvas.height = svgElement.attributes.height.value;

  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(17,24,39)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  var img = new Image();

  img.onload = function()
  {
      DOMURL.revokeObjectURL(objectUrl);

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(theBlob => {
        try
        {
          let blobby;
          if (isSafari())
            blobby = new Promise(resolve => resolve(theBlob));
          else
            blobby = theBlob;

          let clipboardItem = new ClipboardItem({'image/png': blobby});
          navigator.clipboard.write([clipboardItem]).then(x=> console.log("Copied"), err => console.log("Copy failed! " + err));
          Tools.toast("Chart copied.")
        }
        catch{
          Tools.toast("Unable to copy chart on this browser/device.")
        }
        
      });
  }

  img.src = objectUrl;
}

function isSafari()
{
  return navigator.vendor.match(/apple/i) &&
        !navigator.userAgent.match(/crios/i) &&
        !navigator.userAgent.match(/fxios/i) &&
        !navigator.userAgent.match(/Opera|OPT\//);
}

export default SeaIceUi;