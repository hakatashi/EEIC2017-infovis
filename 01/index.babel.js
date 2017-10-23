require('babel-polyfill');

const D3 = require('d3');
const p = require('util.promisify');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(async () => {
	const data = await new Promise((resolve, reject) => {
		D3.csv('data_basics.csv', (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});

	const svg = D3.select('body').append('svg').attr('width', 2000).attr('height', 1000);

	const circles = svg.selectAll('circle').data(data)
		.enter().append('circle');

	const bars = svg.selectAll('rect').data(data)
		.enter().append('rect');

	const texts = svg.selectAll('text').data(data)
		.enter().append('text');

	const path = svg.append('path');

	circles
		.attr('cx', (_, index) => index * 70 + 50)
		.attr('cy', 100)
		.attr('r', ({score}) => score / 2)
		.attr('fill', 'black');

	bars
		.attr('x', (_, index) => index * 70 + 35)
		.attr('y', ({score}) => 400 - score * 2)
		.attr('height', ({score}) => score * 2)
		.attr('width', 30);

	texts
		.text(({group}) => group)
		.attr('x', (_, index) => (index * 70) + 50)
		.attr('y', 30)
		.attr('fill', 'black')
		.attr('text-anchor', 'middle');

	const line = D3.line()
		.x((_, index) => (index * 70) + 50)
		.y(({score}) => 600 - score);

	path
		.attr('d', line(data))
		.attr('stroke-width', 3)
		.attr('stroke', 'black')
		.attr('fill', 'none');
})();
