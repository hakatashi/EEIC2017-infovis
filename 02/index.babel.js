require('babel-polyfill');

const D3 = require('D3');
require('d3-selection-multi');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(async () => {
	const width = 1000;
	const height = 600;
	const offset = 40;
	let currentYear = 1800;
	let selectedRegion = null;
	const color = D3.scaleOrdinal(D3.schemeCategory10);

	const incomeScale = D3.scaleLog().domain([1e2, 1e5]).range([0, width]);
	const lifeScale = D3.scaleLinear().domain([10, 90]).range([height, 0]);
	const populationScale = D3.scaleSqrt().domain([0, 1e9]).range([1, 50]);

	const svg = D3.select('body').append('svg');

	svg.attrs({
		width: width + offset * 2,
		height: height + offset * 2,
		transform: `translate(${offset}, ${offset})`,
	});

	const incomeAxis = svg.append('g');
	incomeAxis.attrs({
		class: 'incomeAxis',
		fill: 'none',
		stroke: 'black',
		'shape-rendering': 'crispEdges',
		transform: `translate(0, ${height})`,
	});
	incomeAxis.call(D3.axisBottom(incomeScale).ticks(5, D3.format(',d')));
	incomeAxis.selectAll('text').attrs({
		fill: 'black',
		stroke: 'none',
	});

	const lifeAxis = svg.append('g');
	lifeAxis.attrs({
		class: 'lifeAxis',
		fill: 'none',
		stroke: 'black',
		'shape-rendering': 'crispEdges',
	});
	lifeAxis.call(D3.axisLeft(lifeScale));
	lifeAxis.selectAll('text').attrs({
		fill: 'black',
		stroke: 'none',
	});

	const incomeLabel = svg.append('text');
	incomeLabel.attrs({
		class: 'incomeLabel',
		'text-anchor': 'end',
		x: width,
		y: height - 10,
	});
	incomeLabel.text('Income per capita (USD)');

	const lifeLabel = svg.append('text');
	lifeLabel.attrs({
		class: 'lifeLabel',
		'text-anchor': 'end',
		y: 15,
		transform: 'rotate(-90)',
	});
	lifeLabel.text('Life expectancy (years)');

	const yearLabel = svg.append('text');
	yearLabel.attrs({
		class: 'yearLabel',
		'text-anchor': 'end',
		'font-size': 50,
		x: width,
		y: height - 35,
	});
	yearLabel.text(currentYear);

	const nations = await new Promise((resolve) => {
		D3.json('nations.json', resolve);
	});


	const interpolateValues = (values, year) => {
		const bisect = D3.bisector(([sectYear]) => sectYear);
		const index = bisect.left(values, year, 0, values.length - 1);
		const [leftYear, leftValue] = values[index];

		if (index <= 0) {
			return leftValue;
		}

		const [rightYear, rightValue] = values[index - 1];
		const tilt = (year - leftYear) / (rightYear - leftYear);
		return Math.round(leftValue * (1 - tilt) + rightValue * tilt);
	};

	const interpolateData = (year) => (
		nations.map((nation) => ({
			name: nation.name,
			region: nation.region,
			income: interpolateValues(nation.income, year),
			population: interpolateValues(nation.population, year),
			lifeExpectancy: interpolateValues(nation.lifeExpectancy, year),
		}))
	);

	const circles = svg.append('g');
	circles.attrs({class: 'circles'});

	const circle = circles.selectAll('.circle');
	const circleEnter = circle.data(interpolateData(currentYear)).enter().append('circle').attrs({
		class: 'circle',
		fill: 'white',
		stroke: 'black',
	}).style('transition', 'all 0.2s ease');

	const updateCircles = () => {
		circleEnter.data(interpolateData(currentYear)).call((element) => element.attrs({
			cx: ({income}) => incomeScale(income),
			cy: ({lifeExpectancy}) => lifeScale(lifeExpectancy),
			r: ({population}) => populationScale(population),
			fill: ({region}) => color(region),
			opacity: ({region}) => {
				if (selectedRegion === null || selectedRegion === region) {
					return 1;
				}

				return 0.2;
			},
		})).sort((a, b) => b.population - a.population);
	};

	updateCircles();

	const tooltip = svg.append('text');

	D3.select('body').on('keydown', () => {
		if (D3.event.keyCode === 37 && currentYear !== 1800) {
			currentYear--;
			yearLabel.text(currentYear);
			updateCircles();
		}

		if (D3.event.keyCode === 39 && currentYear !== 2009) {
			currentYear++;
			yearLabel.text(currentYear);
			updateCircles();
		}
	});

	circleEnter.on('click', ({region}) => {
		D3.event.stopPropagation();
		selectedRegion = region;
		updateCircles();
	});

	D3.select('body').on('click', () => {
		selectedRegion = null;
		updateCircles();
	});

	circleEnter.on('mouseenter', ({name}) => {
		tooltip.text(name).attrs({
			x: D3.event.target.cx.baseVal.value,
			y: D3.event.target.cy.baseVal.value - D3.event.target.r.baseVal.value - 10,
			fill: 'white',
			stroke: 'black',
			'stroke-width': 5,
			'font-size': 20,
			'font-weight': 'bold',
			'paint-order': 'stroke',
			'text-anchor': 'middle',
		});
	});

	circleEnter.on('mouseleave', () => {
		tooltip.text('');
	});
})();
