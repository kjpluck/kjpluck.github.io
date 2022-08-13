
function SeaIceUi(){}

SeaIceUi.initialise = function(doclick){
  addClickToAllInputs(doclick);
}

let monthSelector;

function addClickToAllInputs(doclick)
{
  var theInputs = Array.from(document.getElementsByTagName("input"))

  for(let theInput of theInputs){
      theInput.onclick = doclick;
  }

  monthSelector = document.getElementById("monthSelector");

  monthSelector.onchange = function()
    {
      document.getElementById("Month").checked = true;
      doclick();
    }

  let theCopyButton = document.getElementById("CopyButton");
  theCopyButton.onclick = copyGraphToClipboard;

  
  let nextMonthButton = document.getElementById("nextMonthButton");
  nextMonthButton.onclick = nextMonth;

  let prevMonthButton = document.getElementById("prevMonthButton");
  prevMonthButton.onclick = prevMonth;
}

function nextMonth() {
  var i = monthSelector.selectedIndex;
  monthSelector.options[++i%monthSelector.options.length].selected = true;
  monthSelector.onchange();
}

function prevMonth() {
  var i = monthSelector.selectedIndex-1;
  if(i < 0) i = monthSelector.options.length-1;
  monthSelector.options[i].selected = true;
  monthSelector.onchange();
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

function copyStylesInline(destinationNode, sourceNode) {
  var containerElements = ["svg","g"];
  for (var cd = 0; cd < destinationNode.childNodes.length; cd++) {
      var child = destinationNode.childNodes[cd];
      if (containerElements.indexOf(child.tagName) != -1) {
           copyStylesInline(child, sourceNode.childNodes[cd]);
           continue;
      }
      var style = sourceNode.childNodes[cd].currentStyle || window.getComputedStyle(sourceNode.childNodes[cd]);
      if (style == "" || style == null) continue;
      for (var st = 0; st < style.length; st++){
           child.style.setProperty(style[st], style.getPropertyValue(style[st]));
      }
  }
}

function getSvgString(svgElement)
{
  let svgElementClone = svgElement.cloneNode(true);
  copyStylesInline(svgElementClone, svgElement);

  var svgString = (new XMLSerializer()).serializeToString(svgElementClone);

  return svgString;
}

function copyGraphToClipboard()
{
  let svgElement = document.getElementsByTagName("svg")[0];
  let svgString = getSvgString(svgElement);

  var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});

  var DOMURL = window.URL || window.webkitURL || window;
  var objectUrl = DOMURL.createObjectURL(svgBlob);

  var canvas = document.createElement("canvas");

  var bbox = svgElement.getBBox();
  canvas.width = bbox.width;
  canvas.height = bbox.height;

  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, bbox.width, bbox.height);

  var img = new Image();

  img.onload = function()
  {
    DOMURL.revokeObjectURL(objectUrl);

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(theBlob => {
      let clipboardItem = new ClipboardItem({'image/png': theBlob});
      navigator.clipboard.write([clipboardItem]);
    });

    toast("Chart copied.")
  }

  img.src = objectUrl;
}

function toast(message) {
  var toastElement = document.getElementById("snackbar");
  toastElement.className = "show";
  toastElement.textContent = message;

  setTimeout(function(){ toastElement.className = toastElement.className.replace("show", ""); }, 3000);
}

export default SeaIceUi;