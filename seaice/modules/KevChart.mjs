import * as d3 from "https://cdn.skypack.dev/d3@7";

const margin = {top: 187, right: 187, bottom: 187, left: 60};
  
class KevChart
{

  #element;
  #width;
  #height;
  #contentWidth;
  #contentHeight;

  #d3Svg;
  #xScalor; #yScalor;
  #xAxisElement; #yAxisElement;
  #xAxisGenerator;
  #plottingArea;
  #brushArea;
  #zoomBrush;

  config;

  constructor(element, config)
  {
    this.#element = element;
    this.config = config;

    this.#width = this.#element.offsetWidth;
    this.#height = this.#element.offsetHeight;

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
      .append("g")
        .attr("transform", `translate(${margin.right},${margin.top})`);
  }

  #addAxes()
  {
    const xTicks = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    
    this.#xScalor = d3.scaleLinear().range([0, this.#contentWidth]).domain([1, 366]);
    const yConfig = this.config.options.axes.y;
    this.#yScalor = d3.scaleLinear().range([0, this.#contentHeight]).domain([yConfig.max, yConfig.min]);
    
    this.#xAxisGenerator = d3.axisBottom(this.#xScalor);
    this.#xAxisGenerator.tickValues([1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366]);
    this.#xAxisGenerator.tickFormat((_, i) => xTicks[i]);
    this.#xAxisGenerator.tickSize(-this.#contentHeight);


    this.#appendClipPath("xAxisClipPath", 0, 0,this.#contentWidth, this.#height, 10);
    this.#xAxisElement = this.#d3Svg.append("g")
      .attr("clip-path", "url(#xAxisClipPath)")
      .append("g")
      .attr("transform", `translate(0, ${this.#contentHeight})`)
      .call(this.#xAxisGenerator);

    this.#appendClipPath("yAxisClipPath", -margin.left, 0, this.#width, this.#contentHeight, 10);
    this.#yAxisElement = this.#d3Svg.append("g")
      .attr("clip-path", "url(#yAxisClipPath)")
      .append("g")
      .call(d3.axisLeft(this.#yScalor));
    
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
    this.#xScalor.domain([1, 366]);
    const yConfig = this.config.options.axes.y;
    this.#yScalor.domain([yConfig.max, yConfig.min]);
  }

  #updateAxis()
  {
    this.#xAxisElement.transition().duration(1000).call(this.#xAxisGenerator);
    this.#yAxisElement.transition().duration(1000).call(d3.axisLeft(this.#yScalor));
    this.#plottingArea.transition().duration(1000).attr("transform", this.#createTransform());
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
    
    let translate = [this.#xScalor(0), this.#yScalor(0)];
    let scale = [this.#xScalor(1) - this.#xScalor(0), this.#yScalor(1) - this.#yScalor(0)];

    let plottingClipArea = this.#d3Svg
      .append('g')
        .attr("clip-path", "url(#clip)");

    this.#plottingArea = plottingClipArea
      .append("g")
        .attr("id", "plottingArea")
        .attr("transform", this.#createTransform());
    
    this.#brushArea = plottingClipArea
      .append("g")
      .attr("id", "brushArea");
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
    }

    this.#xAxisElement.transition().duration(1000).call(this.#xAxisGenerator);
    this.#yAxisElement.transition().duration(1000).call(d3.axisLeft(this.#yScalor));
    this.#plottingArea.transition().duration(1000).attr("transform", this.#createTransform());
  }

  #lineGenerator = d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .defined(d => d.y);

  #plotData()
  {
    let datasets = this.config.data.datasets;

    let paths = this.#plottingArea
      .selectAll("path")
      .data(datasets, d => d.year);

    paths.exit().remove();

    paths.enter()
      .append("path")
        .datum(dataset => dataset.data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("vector-effect", "non-scaling-stroke")
        .merge(paths)
        .attr("d", this.#lineGenerator.bind(this)
      );
      
  }


  update()
  {
    this.#resetScale();
    this.#updateAxis();
    this.#plotData();
  }

}

export default KevChart;