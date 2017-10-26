require('babel-polyfill');

const assert = require('assert');

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
	const width = 1600;
	const height = 800;

	let mode = 'population';

	const populationColorScale = D3.scaleLinear().domain([5e5, 130e5]).range([255, 0]);
	const increaseColorScale = D3.scaleLinear().domain([0, 0.1]).range([255, 0]);
	const unemploymentColorScale = D3.scaleLinear().domain([0, 0.3]).range([255, 0]);
	const svg = D3.select('body').append('svg').attrs({width, height});

	const populationMap = new Map(JapanPopulationData.Data.map((data) => ([
		data.Prefecture,
		data.Population_2010,
	])));

	const increaseMap = new Map(JapanPopulationData.Data.map((data) => ([
		data.Prefecture,
		data.Population_2010 / data.Population_2000,
	])));

	const japanAreaData = await new Promise((resolve) => {
		D3.json('japan.topojson', resolve);
	});

	const usaAreaData = await new Promise((resolve) => {
		D3.json('us-counties.topojson', resolve);
	});

	const japan = topojson.feature(japanAreaData, japanAreaData.objects.japan);

	const mapProjection = D3.geoMercator().center([137, 34]).translate([width / 4, height / 2]).scale(1500);
	const mapPath = D3.geoPath().projection(mapProjection);

	const getPrefertureColor = (name) => {
		if (mode === 'population') {
			return `rgb(${[
				255,
				Math.floor(populationColorScale(populationMap.get(name))),
				Math.floor(populationColorScale(populationMap.get(name))),
			].join(',')})`;
		}

		assert(mode === 'increase');
		const increase = increaseMap.get(name);
		if (increase > 1) {
			return `rgb(${[
				255,
				Math.floor(increaseColorScale(increase - 1)),
				Math.floor(increaseColorScale(increase - 1)),
			].join(',')})`;
		}

		return `rgb(${[
			Math.floor(increaseColorScale(1 - increase)),
			Math.floor(increaseColorScale(1 - increase)),
			255,
		].join(',')})`;
	};

	const japanGroup = svg.append('g');

	const map = japanGroup.selectAll('path').data(japan.features).enter().append('path').attrs({
		d: mapPath,
		fill: ({properties: {nam_ja: name}}) => getPrefertureColor(name),
		stroke: '#333333',
		'stroke-width': 0.5,
	});

	const detailText = japanGroup.append('text').attrs({
		x: 50,
		y: 50,
		'font-size': 24,
		stroke: 'none',
		fill: 'black',
	});

	map.on('mouseover', ({properties: {nam_ja: name}}) => {
		if (mode === 'population') {
			detailText.text(`${name}: ${populationMap.get(name)}人`);
		} else if (mode === 'increase') {
			detailText.text(`${name}: ${Math.floor(increaseMap.get(name) * 100)}%`);
		}
	});

	window.addEventListener('keydown', ({code}) => {
		if (code === 'Space') {
			// eslint-disable-next-line prefer-destructuring
			mode = {population: 'increase', increase: 'population'}[mode];
			japanGroup.selectAll('path').data(japan.features).call((element) => element.attrs({
				d: mapPath,
				fill: ({properties: {nam_ja: name}}) => getPrefertureColor(name),
				stroke: '#333333',
				'stroke-width': 0.5,
			}));
		}
	});

	const usaCountyData = await new Promise((resolve, reject) => {
		D3.csv('us-county-names.csv', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	const usaUnemploymentData = await new Promise((resolve, reject) => {
		D3.csv('us_unemployment_rate.csv', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	const usaUnemploymentMap = new Map(usaUnemploymentData.map(({County, Unemployment}) => [County, Unemployment]));
	const usaCountyMap = new Map(usaCountyData.map(({id, name}) => [id, name]));

	const usa = topojson.feature(usaAreaData, usaAreaData.objects.counties);

	const usaMapProjection = D3.geoAlbersUsa().translate([width * 0.7, height * 0.4]).scale(1000);
	const usaMapPath = D3.geoPath().projection(usaMapProjection);

	const usaGroup = svg.append('g');

	const usaMap = usaGroup.selectAll('path').data(usa.features).enter().append('path').attrs({
		d: usaMapPath,
		stroke: '#333333',
		'stroke-width': 0.5,
		fill: ({id}) => `rgb(${[
			Math.floor(unemploymentColorScale(usaUnemploymentMap.get(id.toString()))),
			Math.floor(unemploymentColorScale(usaUnemploymentMap.get(id.toString()))),
			255,
		].join(',')})`,
	});

	const usaDetailText = usaGroup.append('text').attrs({
		x: 800,
		y: 50,
		'font-size': 24,
		stroke: 'none',
		fill: 'black',
	});

	usaMap.on('mouseover', ({id}) => {
		usaDetailText.text(`${usaCountyMap.get(id.toString())}: ${usaUnemploymentMap.get(id.toString())}`);
	});
})();
