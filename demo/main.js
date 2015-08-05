var gridEditor = require('..');

window.init = function() {

	var editor = gridEditor({
		columnHeaders: [
			'X',
			'Y',
			'Trade Name',
			'Application',
			'Material',
			'Features'
		],
		columnTypes: [
			'number',
			'number',
			'string',
			'string',
			'string',
			'string'
		],
		columnClasses: [
			'number',
			'number',
			'string',
			'string',
			'string',
			'string'
		],
		serializeRow: function(values, cells) {
			return {
				point: { x: values[0], y: values[1] },
				tradeName: values[2],
				application: values[3],
				material: values[4],
				features: values[5]
			};
		},
		data: [
			[1, 2, 'foo', 'bar', 'baz', 'bleem'],
			[7, 8, 'foo', 'bar', 'baz', 'bleem']
		]
	});

	var buttons = document.querySelectorAll('[data-op]');
	for (var i = 0; i < buttons.length; ++i) {
		(function(btn) {
			btn.onclick = function() {
				editor[btn.getAttribute('data-op')]();
			}
		})(buttons[i]);
	}

	document.body.appendChild(editor.root);

}