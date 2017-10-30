require('babel-polyfill');

const D3 = require('D3');
require('D3-selection-multi');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(() => {
	const nodes = [
		{name: 'Amazon', id: 1},
		{name: 'Apple', id: 2},
		{name: 'Barnes & Noble', id: 3},
		{name: 'Ericsson', id: 4},
		{name: 'Foxconn', id: 5},
		{name: 'Google', id: 6},
		{name: 'HTC', id: 7},
		{name: 'Huawei', id: 8},
		{name: 'Inventec', id: 9},
		{name: 'Kodak', id: 10},
		{name: 'LG', id: 11},
		{name: 'Microsoft', id: 12},
		{name: 'Motorola', id: 13},
		{name: 'Nokia', id: 14},
		{name: 'Oracle', id: 15},
		{name: 'Qualcomm', id: 16},
		{name: 'RIM', id: 17},
		{name: 'Samsung', id: 18},
		{name: 'Sony', id: 19},
		{name: 'ZTE', id: 20},
	];

	const links = [
		{source: 'Microsoft', target: 'Amazon', type: 'licensing'},
		{source: 'Microsoft', target: 'HTC', type: 'licensing'},
		{source: 'Samsung', target: 'Apple', type: 'suit'},
		{source: 'Motorola', target: 'Apple', type: 'suit'},
		{source: 'Nokia', target: 'Apple', type: 'resolved'},
		{source: 'HTC', target: 'Apple', type: 'suit'},
		{source: 'Kodak', target: 'Apple', type: 'suit'},
		{source: 'Microsoft', target: 'Barnes & Noble', type: 'suit'},
		{source: 'Microsoft', target: 'Foxconn', type: 'suit'},
		{source: 'Oracle', target: 'Google', type: 'suit'},
		{source: 'Apple', target: 'HTC', type: 'suit'},
		{source: 'Microsoft', target: 'Inventec', type: 'suit'},
		{source: 'Samsung', target: 'Kodak', type: 'resolved'},
		{source: 'LG', target: 'Kodak', type: 'resolved'},
		{source: 'RIM', target: 'Kodak', type: 'suit'},
		{source: 'Sony', target: 'LG', type: 'suit'},
		{source: 'Kodak', target: 'LG', type: 'resolved'},
		{source: 'Apple', target: 'Nokia', type: 'resolved'},
		{source: 'Qualcomm', target: 'Nokia', type: 'resolved'},
		{source: 'Apple', target: 'Motorola', type: 'suit'},
		{source: 'Microsoft', target: 'Motorola', type: 'suit'},
		{source: 'Motorola', target: 'Microsoft', type: 'suit'},
		{source: 'Huawei', target: 'ZTE', type: 'suit'},
		{source: 'Ericsson', target: 'ZTE', type: 'suit'},
		{source: 'Kodak', target: 'Samsung', type: 'resolved'},
		{source: 'Apple', target: 'Samsung', type: 'suit'},
		{source: 'Kodak', target: 'RIM', type: 'suit'},
		{source: 'Nokia', target: 'Qualcomm', type: 'suit'},
	];

	const width = 600;
	const height = 500;

	const colorScale = D3.scaleOrdinal(D3.schemeCategory10);

	const companySvg = D3.select('#company').append('svg').attrs({
		width: 150,
		height,
	});

	const companyText = companySvg.selectAll('text').data(nodes)
		.enter().append('text').text(({name}) => name).attrs({
			x: 0,
			y: (data, index) => (index * 20) + 20,
			fill: 'black',
			stroke: 'none',
		});

	const graphSvg = D3.select('#graph').append('svg').attrs({
		width,
		height,
	});

	const simulation = D3.forceSimulation()
		.force('link', D3.forceLink().id(({name}) => name))
		.force('charge', D3.forceManyBody())
		.force('center', D3.forceCenter(width / 2, height / 2));

	const link = graphSvg.selectAll('line').data(links)
		.enter().append('line').attrs({
			stroke: ({type}) => colorScale(type),
			'stroke-width': 2,
		});

	const dragHandler = D3.drag();

	dragHandler.on('start', (data) => {
		if (!D3.event.active) {
			simulation.alphaTarget(0.3).restart();
		}
		data.fx = data.x;
		data.fy = data.y;
	});

	dragHandler.on('drag', (data) => {
		data.fx = D3.event.x;
		data.fy = D3.event.y;
	});

	dragHandler.on('end', (data) => {
		if (!D3.event.active) {
			simulation.alphaTarget(0);
		}
		data.fx = null;
		data.fy = null;
	});

	const node = graphSvg.selectAll('circle').data(nodes)
		.enter().append('g').attrs({class: 'node_group'}).call(dragHandler);

	const nodeCircle = graphSvg.selectAll('.node_group').append('circle').attrs({
		stroke: 'black',
		fill: 'black',
		class: ({id}) => `node_${id}`,
		r: 5,
	});

	const nodeText = graphSvg.selectAll('.node_group').append('text').attrs({
		stroke: 'none',
		fill: 'black',
	}).text(({name}) => name);

	simulation.nodes(nodes).on('tick', () => {
		link
			.attr('x1', (d) => d.source.x)
			.attr('y1', (d) => d.source.y)
			.attr('x2', (d) => d.target.x)
			.attr('y2', (d) => d.target.y);

		node
			.selectAll('circle')
			.attr('cx', (d) => d.x)
			.attr('cy', (d) => d.y);

		node
			.selectAll('text')
			.attr('x', (d) => d.x + 10)
			.attr('y', (d) => d.y + 10);
	});

	simulation.force('link').links(links).distance(50);

	companyText.on('mouseover', ({id}) => {
		graphSvg.select(`.node_${id}`).attrs({fill: 'red'});
	});

	companyText.on('mouseout', () => {
		graphSvg.selectAll('circle').attrs({fill: 'black'});
	});

	companyText.on('click', ({name: clickedName}) => {
		graphSvg.selectAll('circle').attrs({
			opacity: ({name: targetName}) => (
				(
					targetName === clickedName ||
					links.some(({source, target}) => (
						(source.name === clickedName && target.name === targetName) ||
						(source.name === targetName && target.name === clickedName)
					))
				) ? 1 : 0.3
			),
		});

		graphSvg.selectAll('line').attrs({
			opacity: ({source}) => source.name === clickedName ? 1 : 0.2,
		});
	});

	[nodeCircle, nodeText].forEach((item) => {
		item.on('click', ({name: clickedName}) => {
			graphSvg.selectAll('text').attrs({
				opacity: ({name: targetName}) => (
					(
						targetName === clickedName ||
						links.some(({source, target}) => (
							(source.name === clickedName && target.name === targetName) ||
							(source.name === targetName && target.name === clickedName)
						))
					) ? 1 : 0.3
				),
			});
		});
	});
})();
