require('babel-polyfill');

const D3 = require('D3');
require('d3-selection-multi');

require('script-loader!./japan_population.json');
const JapanPopulationData = require('japan-population');

const topojson = require('topojson');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(async () => {
	const width = 800;
	const height = 800;

	const colorScale = D3.scaleLinear().domain([5e5, 130e5]).range([255, 0]);
	const svg = D3.select('body').append('svg').attrs({width, height});

	const populationMap = new Map(JapanPopulationData.Data.map((data) => ([
		data.Prefecture,
		data.Population_2010,
	])));

	const japanAreaData = await new Promise((resolve) => {
		D3.json('japan.topojson', resolve);
	});

	const japan = topojson.feature(japanAreaData, japanAreaData.objects.japan);

	const mapProjection = D3.geoMercator().center([137, 34]).translate([width / 2, height / 2]).scale(1500);
	const mapPath = D3.geoPath().projection(mapProjection);

	const map = svg.selectAll('path').data(japan.features).enter().append('path').attrs({
		d: mapPath,
		fill: ({properties: {nam_ja}}) => (
			`rgb(${[
				255,
				Math.floor(colorScale(populationMap.get(nam_ja))),
				Math.floor(colorScale(populationMap.get(nam_ja))),
			].join(',')})`
		),
		stroke: '#333333',
		'stroke-width': 0.5,
	});

	const detailText = svg.append('text').attrs({
		x: 50,
		y: 50,
		'font-size': 24,
		stroke: 'none',
		fill: 'black',
	});

	map.on('mouseover', ({properties: {nam_ja}}) => {
		detailText.text(`${nam_ja}: ${populationMap.get(nam_ja)}人`);
	});
})();
