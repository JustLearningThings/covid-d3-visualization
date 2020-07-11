var width = 1200;
var height = 750;
var padding = 75;

var svg = d3.select('svg')
			.attr('width', width)
			.attr('height', height);

appendLegend();

var tooltip = d3.select('body')
				.append('div')
				  .classed('tooltip', true);

d3.csv('https://covid.ourworldindata.org/data/owid-covid-data.csv', (error, data) => {	
	if(error) throw error;

	data = data.filter(d => d.population !== '' && d.total_cases !== '' 
		&& d.total_deaths !== '' && d.population_density !== '');
	var currentDate = new Date(Date.now()).toISOString().split('T').shift();

	// if there is no data for today, switch to yesterday
	while(data.filter(d => d.date === currentDate).length === 0)
		currentDate = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T').shift()

	createPlot(data, currentDate);

	d3.select('[type=\'date\']')
	  .attr('value', currentDate)
	  .on('input', () => { 
	  	if(d3.event.target.value > currentDate || 
	  		d3.event.target.value < '2020-01-01') 
	  		d3.event.target.value = currentDate;

	  	createPlot(data, d3.event.target.value)
	  });

	var search = d3.select('[type=\'search\']')
	  			   .attr('placeholder', 'country...');
	d3.select('form')
	  .on('submit', () => {
	  	d3.event.preventDefault();
	  	var searchStr = search.property('value');
	  	var searchStr = searchStr.charAt(0).toUpperCase() + searchStr.slice(1);

	  	var countryData = data.filter(d => d.date == d3.select('[type=\'date\']').property('value')
	  		&& searchStr === d.location);

	  	if(countryData && countryData.length > 0) {
	  		displayCountryData(countryData[0]);
	  		document.getElementsByClassName('country-data')[0].scrollIntoView({behavior: 'smooth'});
	  	}
	  });
});


function createPlot(data, date) {
	data = data.filter(d => d.date === date);

	var yScale = d3.scaleLinear()
				   .domain(d3.extent(data, d => Number(d.population_density / 100)))
				   .range([height - padding, padding]);
    var xScale = d3.scaleLinear()
    			   .domain(d3.extent(data, d => Number(d.total_cases / 100)))
    			   .range([padding, width - padding]);
    var radiusScale = d3.scaleLinear()
    				   .domain(d3.extent(data, d => Number(d.population)))
    				   .range([5, 12]);
    var colorScale = d3.scaleOrdinal()
   					  .domain(d3.extent(data, d => Number(d.total_deaths)))
   					  .range(['MediumAquaMarine', 'Crimson']);
    var yAxis = d3.axisLeft(yScale)
    			  .tickSize(- width + 2 * padding)
    			  .tickSizeOuter(0);
    var xAxis = d3.axisBottom(xScale)
    			  .tickSize(- height + 2 * padding)
    			  .tickSizeOuter(0);

   				console.log(data)  

    var update = svg
    			  .selectAll('.circle')
    			  .data(data);

    update
      .exit()
      .remove();
    d3.selectAll('.axis')
      .remove();
    d3.select('.svg-legend-title')
      .remove();

    update
      .enter()
      .append('circle')
        .classed('circle', true)
    .merge(update)
      .on('mousemove', d => showTooltip(d))
      .on('touchstart', d => showTooltip(d))
      .on('mouseout', () => hideTooltip())
      .on('touchend', () => hideTooltip())
      .transition()
      .duration(1000)
      .attr('cx', d => xScale(Number(d.total_cases)))
      .attr('cy', d => yScale(Number(d.population_density)))
      .attr('fill', d => colorScale(Number(d.total_deaths)))
      .attr('r', d => radiusScale(Number(d.population)));

    svg
      .append('g')
        .classed('axis', true)
        .attr('transform', `translate(${padding}, 0)`)
        .call(yAxis);
    svg
      .append('g')
        .classed('axis', true)
        .attr('transform', `translate(0, ${height - padding})`)
        .call(xAxis);

    svg
    .append('text')
      .classed('svg-legend', true)
      .classed('svg-legend-title', true)
      .attr('text-anchor', 'middle')
      .attr('font-size', '1.3em')
      .attr('transform', `translate(${width / 2}, 30)`)
      .text(`Coronavirus data for ${date.split('-').join('.')}`);
}

function printExtraDataToTooltip(data) {
	if(data.new_cases !== '') printToTooltip(`New cases: ${data.new_cases.toLocaleString()}`);
	if(data.new_deaths !== '') printToTooltip(`New deaths: ${data.new_deaths.toLocaleString()}`);
	if(data.total_tests !== '') printToTooltip(`Total tests: ${data.total_tests.toLocaleString()}`);
	if(data.new_tests !== '') printToTooltip(`New tests: ${data.new_tests.toLocaleString()}`);
	if(data.aged_65_older !== '') printToTooltip(`Aged 65+ : ${data.aged_65_older.toLocaleString()}`);
	if(data.life_expectancy !== '') printToTooltip(`Life expectancy: ${data.life_expectancy.toLocaleString()}`);
	if(data.median_age !== '') printToTooltip(`Median age: ${data.median_age.toLocaleString()}`);
}

function printToTooltip(text) {
	tooltip
	  .append('p')
	    .text(text);
}

function showTooltip(d) {
	tooltip
      	  .style('opacity', '.75')
      	  .style('left', d3.event.x - tooltip.node().offsetWidth / 2  + 'px')
      	  .style('top', d3.event.y + 15 + 'px')
      	  .html(`
      	  	<p class='tooltip-location'>${d.location.toLocaleString()}</p>
      	  	<p>Total cases: ${d.total_cases.toLocaleString()}</p>
      	  	<p>Total deaths: ${d.total_deaths.toLocaleString()}</p>
      	  	<p>Population: ${d.population.toLocaleString()}</p>
      	  	<p>Density: ${d.population_density.toLocaleString()}</p>
      	  	`);
      	printExtraDataToTooltip(d);
}

function hideTooltip() {
	tooltip
      	  .style('opacity', '0')
      	  .html('');
}

function appendLegend(date) {
    svg
      .append('text')
        .classed('svg-legend', true)
        .attr('text-anchor', 'end')
        .attr('transform', `translate(${width / 2 + 20}, 55)`)
        .text('Total deaths from');
    svg
      .append('circle')
        .classed('circle-legend', true)
        .attr('cx', width / 2 + 35)
        .attr('cy', 50)
        .attr('fill', 'MediumAquaMarine')
        .attr('r', 9);
    svg
      .append('text')
        .classed('svg-legend', true)
        .attr('text-anchor', 'start')
        .attr('transform', `translate(${width / 2 + 52}, 55)`)
        .text('to');
    svg
      .append('circle')
        .classed('circle-legend', true)
        .attr('cx', width / 2 + 80)
        .attr('cy', 50)
        .attr('fill', 'Crimson')
        .attr('r', 9);

   svg
     .append('text')
       .classed('svg-legend', true)
       .attr('text-anchor', 'middle')
       .attr('transform', 'rotate(-90)')
       .attr('dy', '2.25em')
       .attr('x', - height / 2)
       .attr('font-size', '1.15em')
       .text('Population density');
    svg
      .append('text')
        .classed('svg-legend', true)
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height - padding / 2)
        .attr('font-size', '1.15em')
        .text('Total cases');
}

function displayCountryData(d) {
	d3.selectAll('.country-data')
	  .remove();

	var div = d3.select('body')
	  .append('div')
	    .classed('country-data', true)
	    .html(`
      	  	<p class='country-data-location'>${d.location.toLocaleString()}</p>
      	  	<p>Total cases: ${d.total_cases.toLocaleString()}</p>
      	  	<p>Total deaths: ${d.total_deaths.toLocaleString()}</p>
      	  	<p>Population: ${d.population.toLocaleString()}</p>
      	  	<p>Density: ${d.population_density.toLocaleString()}</p>
      	  	`);

    if(d.new_cases !== '') div.append('p').text(`New cases: ${d.new_cases.toLocaleString()}`);
	if(d.new_deaths !== '') div.append('p').text(`New deaths: ${d.new_deaths.toLocaleString()}`);
	if(d.total_tests !== '') div.append('p').text(`Total tests: ${d.total_tests.toLocaleString()}`);
	if(d.new_tests !== '') div.append('p').text(`New tests: ${d.new_tests.toLocaleString()}`);
	if(d.aged_65_older !== '') div.append('p').text(`Aged 65+ : ${d.aged_65_older.toLocaleString()}`);
	if(d.life_expectancy !== '') div.append('p').text(`Life expectancy: ${d.life_expectancy.toLocaleString()}`);
	if(d.median_age !== '') div.append('p').text(`Median age: ${d.median_age.toLocaleString()}`);	    
}