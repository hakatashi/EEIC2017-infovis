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

	const texts = svg.selectAll('text').data(data)
		.enter().append('text');

	const path = svg.append('path');

	const line = D3.line()
		.x(({score}) => (score * 10) + 50)
		.y(() => 100);

	circles
		.attr('cx', ({score}) => (score * 10) + 50)
		.attr('cy', 100)
		.attr('r', ({score}) => score / 2)
		.attr('fill', 'black');

	texts
		.text(({group}) => group)
		.attr('x', ({score}) => (score * 10) + 50)
		.attr('y', 30)
		.attr('fill', 'black')
		.attr('text-anchor', 'middle');

	path
		.attr('d', line(data))
		.attr('stroke-width', 3)
		.attr('stroke', 'black')
		.attr('fill', 'none');
})();
