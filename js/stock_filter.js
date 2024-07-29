// Data + Selection Element processing
const parseDate = d3.timeParse('%Y-%m-%d');
const rawdata = d3.csv('data/stock.csv', (d) => {
  return {
    index: d.Index,
    date: parseDate(d.Date),
    close: +d.CloseUSD, //+ coverts column to number
  };
}).then((rawdata) => {
  const exchangeData = {
    EURONEXT: rawdata.filter(({ index }) => index == 'N100'),
    GERMANY: rawdata.filter(({ index }) => index == 'GDAXI'),
    HONGKONG: rawdata.filter(({ index }) => index == 'HSI'),
    INDIA: rawdata.filter(({ index }) => index == 'NSEI'),
    NASDAQ: rawdata.filter(({ index }) => index == 'IXIC'),
    NYSE: rawdata.filter(({ index }) => index == 'NYA'),
    SHANGHAI: rawdata.filter(({ index }) => index == '000001.SS'),
    SOUTHAFRICA: rawdata.filter(({ index }) => index == 'J203.JO'),
    SWISS: rawdata.filter(({ index }) => index == 'SSMI'),
    TAIWAN: rawdata.filter(({ index }) => index == 'TWII'),
    TOKYO: rawdata.filter(({ index }) => index == 'N225'),
    TORONTO: rawdata.filter(({ index }) => index == 'GSPTSE'),
  };

  const exchangeTypes = Object.keys(exchangeData);
  const defaultSelection = 'NASDAQ';

  d3.select('#stock-select')
    .selectAll('stock-options')
    .data(exchangeTypes)
    .enter()
    .append('option')
    .attr('value', (d) => d)
    .property('selected', function (d) { return d === defaultSelection; })
    .text((d) => d);

  //default data
  const currentSelection = d3.select('#stock-select').property('value');
  plot('#stock-chart', exchangeData[currentSelection], currentSelection);
  // on selection change
  d3.select('#stock-select').on('change', function (d) {
    d3.selectAll('svg').remove();
    plot('#stock-chart', exchangeData[this.value], this.value);
  });
}).catch((error) => {
  console.log(error);
});

// Base positioning
var margin = { top: 50, bottom: 50, left: 60, right: 60 },
  width = 800 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// Plotting data
function plot(divId, data, exchangeName) {
  // svg
  const svg = d3.select(divId)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('overflow', 'visible')
    .append('g')
    .attr('transform',
      'translate(' + margin.left + ',' + margin.top + ')');

  // chart title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 0 - margin.top / 2)
    .attr('text-anchor', 'middle')
    .text(exchangeName);

  // X axis --> date
  var x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);
  xAxis = svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .call((g) => g.append('text')
      .attr('x', width / 2)
      .attr('y', margin.bottom / 2 + 5)
      .attr('class', 'axis-label')
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .text('Date'));

  // Y axis --> stock $
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.close)])
    .range([height, 0])
    .nice();
  yAxis = svg.append('g')
    .attr('transform', 'translate(0, 0)')
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.append('text')
      .attr('x', -margin.left)
      .attr('y', -10)
      .attr('class', 'axis-label')
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .text('↑ Close Price ($)'));

  // plotting line
  const line = d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d.close));
  svg.append('path')
    .datum(data)
    .attr('class', 'stockPlotLine')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line);

  // Annotations
  const annotations = [
    {
      note: {
        title: 'DotCom',
        lineType: 'none',
        align: 'middle',
        wrap: 150,
      },
      subject: {
        height: height,
        width: x(new Date('10/01/2002')) - x(new Date('03/01/2000')),
      },
      type: d3.annotationCalloutRect,
      y: margin.bottom,
      disable: ['connector'],
      dx: (x(new Date('10/01/2002')) - x(new Date('03/01/2000'))) / 2,
      data: { x: '03/01/2000' },
    },
    {
      note: {
        title: 'Great Recession',
        lineType: 'none',
        align: 'middle',
        wrap: 150,
      },
      subject: {
        height: height,
        width: x(new Date('6/1/2009')) - x(new Date('12/1/2007')),
      },
      type: d3.annotationCalloutRect,
      y: margin.top,
      disable: ['connector'],
      dx: (x(new Date('6/1/2009')) - x(new Date('12/1/2007'))) / 2,
      data: { x: '12/1/2007' },
    },
    {
      note: {
        title: 'Covid-19',
        lineType: 'none',
        align: 'middle',
        wrap: 150,
      },
      subject: {
        height: height,
        width: x(new Date('04/01/2020')) - x(new Date('02/01/2020')),
      },
      type: d3.annotationCalloutRect,
      y: margin.top,
      disable: ['connector'],
      dx: (x(new Date('04/01/2020')) - x(new Date('02/01/2020'))) / 2,
      data: { x: '02/01/2020' },
    },
  ];
  const makeAnnotations = d3.annotation()
    .type(
      d3.annotationCustomType(
        d3.annotationBadge,
        { 'subject': { 'radius': 10 } }
      )
    )
    .accessors({
      x: function (d) { return x(new Date(d.x)) },
      y: function (d) { return y(d.y) }
    })
    .annotations(annotations)
  svg.append('g')
    .attr('transform', 'translate(0,' + -margin.top + ')')
    .attr('class', 'annotation-group')
    .call(makeAnnotations);

  // add the dots with tooltips
  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  function forma_date(date) {
    return date.toLocaleString('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  svg.selectAll("dot")
    .data(data)
    .enter().append("circle")
    .style("fill", 'rgb(129, 1, 1)')
    .style("opacity", 0)
    .attr("r", 5)
    .attr("cx", function (d) { return x(d.date); })
    .attr("cy", function (d) { return y(d.close); })
    .on("mouseover", function (event, d) {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      d3.select(this).style("opacity", 1);
      div.html(forma_date(d.date) + "<br/>" + d.close)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (event, d) {
      d3.select(this).style("opacity", 0);
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });

};