import * as d3 from "https://cdn.skypack.dev/d3@7";
//import * as d3 from "d3";
import Tools from "./tools.mjs";

const margin = {top: 100, right: 100, bottom: 110, left:100};
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const monthStartDay = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

function makeDate(dayIndex)
{
  let day = dayIndex + 1;
  let month = 1;
  while(day > monthStartDay[month] - 1)
  {
    month++;
  }
  
  return `${day - (monthStartDay[month-1] - 1)} ${monthNames[month-1]}` 
}

class KevChart
{

  #element;
  #width;
  #height;
  #contentWidth;
  #contentHeight;

  #d3Svg;
  #chartTitle;
  #xScalor; #yScalor;
  #xAxisElement; #yAxisElement;
  #xAxisGridElement; #xAxisGridGenerator;
  #xAxisLabel; #yAxisLabel;
  #xAxisGenerator;
  #plottingArea;
  #yearSelectorArea;
  #brushArea;
  #zoomBrush;
  #tooltip;

  #showResetZoomMsg = true;

  config;

  constructor(element, config)
  {
    this.#element = element;
    this.config = config;

    this.#width = 1000;
    this.#height = 710;

    this.#contentWidth = this.#width - margin.right - margin.left;
    this.#contentHeight = this.#height - margin.top - margin.bottom;
    
    this.#render();
  }

  #render()
  {
    this.#makeD3Svg();
    this.#addAxes();
    this.#addPlottingArea();
    this.#addZoomControl();
    this.#plotData();

    this.#d3Svg
        .append('g')
          .attr("clip-path", "url(#clip)")
          .append("text")
          .attr("x", this.#contentWidth - 10)
          .attr("y", this.#contentHeight - 10)
          .attr("font-size", 15)
          .attr("text-anchor", "end")
          .text("@KevPluck");

    // Starting point for zooming with the use of clip paths and transforms:
    //  https://stackoverflow.com/questions/25142240/how-to-apply-d3-js-svg-clipping-after-zooming

    // Scaling axes when zooming:
    //  https://d3-graph-gallery.com/graph/interactivity_zoom.html
  }

  #makeD3Svg()
  {
    this.#d3Svg = d3.select(this.#element)
      .append("svg")
      .attr("width", this.#width)
      .attr("height", this.#height)
      .attr("font-size", "1.5rem")
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("font-family", "sans-serif");
    
    this.#chartTitle = this.#d3Svg.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "2rem")
    .attr("transform", `translate(${this.#contentWidth / 2},-50)`)
    .text(this.config.data.title);
  }

  #addAxes()
  {    
    const xConfig = this.config.options.axes.x;
    this.#xScalor = d3.scaleLinear().range([0, this.#contentWidth]).domain([xConfig.min, xConfig.max]);
    const yConfig = this.config.options.axes.y;
    this.#yScalor = d3.scaleLinear().range([0, this.#contentHeight]).domain([yConfig.max, yConfig.min]);
    
    this.#xAxisGenerator = d3.axisBottom(this.#xScalor);
    this.#xAxisGenerator.tickValues(monthStartDay);
    this.#xAxisGenerator.tickFormat((_, i) => monthNames[i]);

    this.#xAxisGridGenerator = d3.axisBottom(this.#xScalor);
    this.#xAxisGridGenerator.tickValues(monthStartDay);
    this.#xAxisGridGenerator.tickFormat("");
    this.#xAxisGridGenerator.tickSize(-this.#contentHeight);

    this.#appendClipPath("xAxisClipPath", 0, 0,this.#contentWidth, this.#height, 10);

    this.#xAxisGridElement = this.#d3Svg.append("g")
      .attr("clip-path", "url(#xAxisClipPath)")
      .append("g")
      .attr("transform", `translate(0, ${this.#contentHeight})`)
      .call(this.#xAxisGridGenerator).call(this.#xTickGridStyle);

    this.#xAxisElement = this.#d3Svg.append("g")
      .attr("clip-path", "url(#xAxisClipPath)")
      .append("g")
      .attr("transform", `translate(0, ${this.#contentHeight})`)
      .call(this.#xAxisGenerator).call(this.#tickTextStyle);
    
    this.#xAxisLabel = this.#d3Svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${this.#contentWidth / 2}, ${this.#contentHeight + 45})`)
      .text(xConfig.title);

    this.#appendClipPath("yAxisClipPath", -margin.left, 0, this.#width, this.#contentHeight, 10);
    this.#yAxisElement = this.#d3Svg.append("g")
      .attr("clip-path", "url(#yAxisClipPath)")
      .append("g")
      .call(d3.axisLeft(this.#yScalor)).call(this.#tickTextStyle);
    
    this.#yAxisLabel = this.#d3Svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90) translate(${-this.#contentHeight / 2},-60)`)
      .text(yConfig.title);
  }

  #xTickGridStyle(selection)
  {
    selection
      .call(g => g.selectAll(".tick line")
      .attr("stroke-opacity", 0.1))
  }

  #tickTextStyle(selection)
  {
    selection
      .call(g => g.selectAll(".tick text")
      .attr("font-size", "1rem"))
  }

  #appendClipPath(id, x, y, width, height, padding=0) 
  {
    this.#d3Svg.append("clipPath")
      .attr("id", id)
      .append("rect")
      .attr("width", width + padding*2)
      .attr("height", height + padding*2)
      .attr("x", x - padding).attr("y", y - padding);
  }


  #resetScale()
  {
    const xConfig = this.config.options.axes.x;
    this.#xScalor.domain([xConfig.min, xConfig.max]);
    const yConfig = this.config.options.axes.y;
    this.#yScalor.domain([yConfig.max, yConfig.min]);
  }

  async #updateAxis()
  {
    if(this.config.options.graphType == "annual")
    {
      this.#xAxisGenerator.tickValues(monthStartDay);
      this.#xAxisGenerator.tickFormat((_, i) => monthNames[i]);
      this.#xAxisGridGenerator.tickValues(monthStartDay);
    }
    else
    {
      this.#xAxisGenerator.tickValues(null);
      this.#xAxisGenerator.tickFormat(d => d);
      this.#xAxisGridGenerator.tickValues(null);
    }

    let tran1 = this.#xAxisElement.transition().duration(1000).call(this.#xAxisGenerator).call(this.#tickTextStyle).end();
    let tran2 = this.#yAxisElement.transition().duration(1000).call(d3.axisLeft(this.#yScalor)).call(this.#tickTextStyle).end();
    let tran3 = this.#plottingArea.transition().duration(1000).attr("transform", this.#createTransform()).end();
    let tran4 = this.#xAxisGridElement.transition().duration(1000).call(this.#xAxisGridGenerator).call(this.#xTickGridStyle).end();

    await Promise.all([tran1, tran2, tran3, tran4]);
    this.#xAxisLabel.text(this.config.options.axes.x.title);
    this.#yAxisLabel.text(this.config.options.axes.y.title);
    this.#chartTitle.text(this.config.data.title);
  }

  #createTransform()
  {
    const translate = [this.#xScalor(0), this.#yScalor(0)];
    const scale = [this.#xScalor(1) - this.#xScalor(0), this.#yScalor(1) - this.#yScalor(0)];
    return  `translate(${translate}) scale(${scale})`;
  }

  #addPlottingArea()
  {
    this.#appendClipPath("clip", 0, 0, this.#contentWidth, this.#contentHeight);
    
    let plottingClipArea = this.#d3Svg
      .append('g')
        .attr("clip-path", "url(#clip)");


    plottingClipArea
      .on("mousemove", this.#showToolTip.bind(this));
    
    plottingClipArea
      .on("mouseleave", this.#hideTooltip.bind(this));

    this.#plottingArea = plottingClipArea
      .append("g")
        .attr("id", "plottingArea")
        .attr("stroke-width", 2)
        .attr("transform", this.#createTransform());
      
    let tooltipSvgGroup = plottingClipArea.append("g").attr("opacity", 0);
    this.#tooltip = new Tooltip(tooltipSvgGroup, 150, 80, this.#contentWidth, this.#contentHeight);

    this.#brushArea = plottingClipArea
      .append("g")
      .attr("id", "brushArea");

  }

  
  #tooltipYear = null;
  #tooltipXCoord = null;
  #tooltipYearIndex = null;
  #showToolTip(event)
  {
    const pos = d3.pointer(event);
    const xCoord = Math.round(this.#xScalor.invert(pos[0]));
    const area = this.#yScalor.invert(pos[1]);

    let closestYear;
    let closestYearIndex;
    let closestDistance = 1000;
    let closestArea;
    let rank = 1;
    

    this.config.data.datasets.forEach((dataset, index) => {

      const datum = dataset.data.find(datum => datum.x == xCoord);
      if(!datum) return;

      const thisArea = datum.y;
      const distance = Math.abs(area - thisArea);
      if(distance < closestDistance)
      {
        closestDistance = distance;
        closestYear = dataset.id;
        closestYearIndex = index;
        closestArea = thisArea;
      }
    });

    this.config.data.datasets.forEach((dataset, index) => {

      const datum = dataset.data.find(datum => datum.x == xCoord);
      if(!datum) return;

      const thisArea = datum.y;
      if(thisArea && thisArea < closestArea)
        rank++;
    });


    const scaledThreshold = 18 / Math.abs(this.#yScalor(1) - this.#yScalor(0));

    if(closestDistance > scaledThreshold)
    {
      this.#hideTooltip();
      this.#highlightYear(null);
      return;
    }
    
    this.#tooltip.show();

    if(closestYear != this.#tooltipYear || xCoord != this.#tooltipXCoord)
    {
      let title = "";
      let subTitle = "";
      if(this.config.options.graphType == "annual")
      {
        title = closestYear;
        subTitle = makeDate(xCoord) + " Rank: " + (rank == 1 ? "lowest" : ordinal_suffix_of(rank));
      }
      else
      {
        title = this.config.options.areaType + " " + this.config.options.graphType;
        subTitle = xCoord;
      }

      this.#tooltip.set(title, subTitle, closestArea.toFixed(2), this.#xScalor(xCoord), this.#yScalor(closestArea));
      
      this.#tooltipYear = closestYear;
      this.#tooltipYearIndex = closestYearIndex;
      this.#tooltipXCoord = xCoord;

      this.#highlightYear(closestYear);
    }
  }

  #hideTooltip()
  {
    this.#tooltipYear = null;
    this.#tooltipYearIndex = null;
    this.#tooltipXCoord = null;
    this.#tooltip.hide();
  }

  #setYearOpacity(yearIndex, yearToHighlight)
  {
    const yearType = this.config.data.datasets[yearIndex].type;

    if(yearToHighlight == null)
      return yearType == "normal year" ? 0.5 : 1.0;
    
    return yearToHighlight == (yearIndex + 1979) ? 1.0 : 0.2;
  }

  async #fadeOutPlot()
  {
    const promise1 = this.#plottingArea.transition().attr("opacity", 0).end();
    const promise2 = this.#yearSelectorArea.transition().attr("opacity", 0).end();

    await Promise.all([promise1, promise2]);
  }
  
  async #fadeInPlot()
  {
    const promise1 = this.#plottingArea.transition().attr("opacity", 1).end();
    const promise2 = this.#yearSelectorArea.transition().attr("opacity", 1).end();

    await Promise.all([promise1, promise2]);
  }

  #highlightYear(yearToHighlight)
  {
    if(this.config.options.graphType == "annual")
    {
      this.#plottingArea.selectAll("path")
        .transition().attr("opacity", (_, yearIndex) => this.#setYearOpacity(yearIndex, yearToHighlight));
      
      this.#yearSelectorArea.selectAll("rect")
        .transition().attr("opacity", (_, yearIndex) => this.#setYearOpacity(yearIndex, yearToHighlight));
    }
    else
    {
      this.#plottingArea.selectAll("path")
        .transition().attr("opacity", 1);
    }
  }

  #addZoomControl()
  {
    this.#zoomBrush = d3.brush()
      .extent( [ [0,0], [this.#contentWidth, this.#contentHeight] ] )
      .on("end", this.#zoomed.bind(this));

    this.#brushArea
      .attr("id", "brush")
      .call(this.#zoomBrush);
  }

  #addYearSelectors()
  {
    if(!this.#yearSelectorArea)
    {
      const thisYear = (new Date()).getUTCFullYear();
      const legendWidth = (thisYear - 1978) * 15;
      const legendXPos = (this.#contentWidth / 2) - (legendWidth / 2);
      this.#yearSelectorArea = this.#d3Svg
        .append('g')
        .attr("transform", `translate(${legendXPos}, ${this.#contentHeight + 110}) rotate(-90)`)
        .attr("font-size", 10);
            
      this.#yearSelectorArea.on("mousemove", this.#yearSelectorMouseMove.bind(this));
    }

    let datasets = this.config.data.datasets;

    if(this.config.options.graphType !== "annual")
      datasets = [];

    const graphType = this.config.options.graphType;

    this.#yearSelectorArea
      .selectAll("g")
      .data(datasets, d => d.id)
      .join(
        enter => addLegendItem(enter),
        update => updateLegendItem(update),
        exit => exit.remove()
      );
    
    function addLegendItem(enter)
    {
      const legendItem = enter.append("g");

      legendItem.append("rect")
        .attr("stroke", "none")
        .attr("fill", d => MakeColour(d, graphType))
        .attr("height", 10)
        .attr("width", 10)
        .attr("opacity", 0)
        .attr("x", 10)
        .attr("y", d => calcYearY(d.id));
      
      legendItem.append("text")
        .attr("x", 25)
        .attr("y", d => calcYearY(d.id) + 9)
        .attr("cursor", "default")
        .text(d => d.id);
    }

    function updateLegendItem(update)
    {
      update.select("rect").attr("fill", d => MakeColour(d, graphType));
      return update;
    }

    function calcYearY(year)
    {
      const yearsSince1979 = year - 1979;
      return 15 * yearsSince1979;
    }
  }

  #currentActiveYearSelector = 0;

  #yearSelectorMouseMove(event)
  {
    const pos = d3.pointer(event);
    const y = Math.floor(pos[1] / 15);
    const year = 1979 + y;

    if(year != this.#currentActiveYearSelector)
    {
      this.#currentActiveYearSelector = year;
      this.#highlightYear(year);
    }
  }
  
  #idleTimeout;
  #idled() { this.#idleTimeout = null; }

  #zoomed(event)
  {
    

    if(event && event.selection)
    {
      const extent = event.selection;
      this.#xScalor.domain([ this.#xScalor.invert(extent[0][0]), this.#xScalor.invert(extent[1][0]) ]);
      this.#yScalor.domain([ this.#yScalor.invert(extent[0][1]), this.#yScalor.invert(extent[1][1]) ]);
    
      this.#brushArea.call(this.#zoomBrush.clear);
    }
    else
    {
      if (!this.#idleTimeout) 
        return this.#idleTimeout = setTimeout(this.#idled.bind(this), 350); // This allows to wait a little bit
      
      this.#resetScale();
      this.#showResetZoomMsg = false;
    }

    this.#xAxisElement.transition().duration(1000).call(this.#xAxisGenerator).call(this.#tickTextStyle);
    this.#xAxisGridElement.transition().duration(1000).call(this.#xAxisGridGenerator).call(this.#xTickGridStyle);
    this.#yAxisElement.transition().duration(1000).call(d3.axisLeft(this.#yScalor)).call(this.#tickTextStyle);
    this.#plottingArea.transition().duration(1000).attr("transform", this.#createTransform());
    
    if(this.#showResetZoomMsg)
      Tools.toast("Double tap/click to reset zoom")
  }

  #lineGenerator = d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .defined(d => d.y);

  #plotData()
  {
    let datasets = this.config.data.datasets;

    const graphType = this.config.options.graphType;
    this.#plottingArea
      .selectAll("path")
      .data(datasets)
      .join("path")
        .attr("original-colour", d => MakeColour(d, graphType))
        .attr("stroke", d => MakeColour(d, graphType))
        .attr("stroke-width", d => MakeStrokeWidth(d, graphType))
        .attr("opacity", 0)
        .datum(d => d.data)
        .attr("fill", "none")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("d", this.#lineGenerator.bind(this));;
    
    this.#addYearSelectors();
    this.#highlightYear(null);
  }


  async update()
  {
    this.#hideTooltip();
    this.#resetScale();
    await this.#fadeOutPlot();
    await this.#updateAxis();
    this.#plotData();
    await this.#fadeInPlot();
  }

  

}

class Tooltip
{
  svgGroup;
  bg;
  title; subTitle; area;
  mark;
  showing = false;
  maxX; maxY;
  padding = 5;
  centre;

  constructor(svgGroup, width, height, maxX, maxY)
  {
    this.svgGroup = svgGroup;
    this.bg = svgGroup.append("rect").attr("fill", "white").attr("width", width).attr("height", height);
    this.height = height;
    this.width = width;
    this.centre = width / 2;
    this.title = svgGroup.append("text").attr("x", 10).attr("y", 20).attr("font-size", 15).attr("font-weight", "bold");
    this.subTitle = svgGroup.append("text").attr("x", 10).attr("y", 40).attr("font-size", 15);
    this.area = svgGroup.append("text").attr("x", 10).attr("y", 60).attr("font-size", 15);
    this.mark = svgGroup.append("circle").attr("cx", this.centre).attr("cy", height + 20).attr("fill", "grey").attr("r", 5);
    this.maxX = maxX;
    this.maxY = maxY;
  }

  show()
  {
    if(this.showing) 
      return;

    this.svgGroup.transition()
        .duration(200)
        .style("opacity", .7);
      
    this.showing = true;
  }

  
  hide()
  {
    if(this.showing)
    {
      this.svgGroup.transition()
        .duration(200)
        .style("opacity", 0);
    }
      
    this.showing = false;
  }

  set(title, subTitle, area, x, y)
  {
    if(y > this.maxY)
    {
      this.hide();
      return;
    }

    let centreWithPadding = this.centre + this.padding;
    const thePos = 
    [
      x < centreWithPadding ? 5 : x > this.maxX - centreWithPadding ? this.maxX - centreWithPadding - this.centre: x - this.centre, 
      y > this.height + 20 ? y - (this.height + 20) : y + 20
    ];

    this.mark.attr("cx", x < centreWithPadding ? this.centre - (centreWithPadding - x) : x > this.maxX - centreWithPadding ? this.centre + (x - (this.maxX - centreWithPadding)) : this.centre);
    this.mark.attr("cy", y > this.height + 20 ? this.height + 20 : -20);

    this.title.text(title);
    this.subTitle.text(subTitle);
    this.area.text(area + " million km²");
    this.svgGroup.attr("transform", `translate(${thePos})`);
    
  }
}

function MakeStrokeWidth(yearData, graphType)
{
  if(yearData.type == "record low year" || yearData.type == "current year")
    return 4;

  return graphType == "annual" ? 2 : 4;
}

//const palette = ["#003f5c", "#444e86", "#955196", "#dd5182", "#ff6e54", "#ffa600"];
const palette = ["#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"];

function MakeColour(yearData, graphType)
{
  if(graphType !== "annual")
    return "#0076ae";

  if(yearData.type == "record low year")
    return "#3497DD";

  if(yearData.type == "current year")
    return "#000000";
  
  var range = 2022 - 1979;
  var pos = yearData.id - 1970;

  const decade = Math.floor(pos/10);
  const yearOfDecade = pos % 10;

  return palette[decade];
  const decadeColour = hexToHSL(palette[decade]);
  



  var lerp = 1 - pos / range;

  var rgb = 150 + Math.floor(lerp * 100);
  var hex = rgb.toString(16);
  return "#" + hex + hex + hex;
}

function hexToHSL(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      r = parseInt(result[1], 16);
      g = parseInt(result[2], 16);
      b = parseInt(result[3], 16);
      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
      if(max == min){
        h = s = 0; // achromatic
      }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
    var HSL = new Object();
    HSL['h']=h;
    HSL['s']=s;
    HSL['l']=l;
    return HSL;
  }

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

export default KevChart;