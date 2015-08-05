module.exports = gridEditor;

var D = require('dom-build');
var ev = require('dom-bind');

var Model = require('./Model');
var Cell = require('./Cell');

function gridEditor(model, opts) {

	if (!(model instanceof Model)) {
		opts = model;
		model = void 0;
	}

	var ui = D('table', D('thead!head'), D('tbody!body'));

	if (!model) {
		model = new Model(opts.columnTypes);
		_importData(model, opts.data || []);
	}

	var columnClasses = opts.columnClasses || [];
	
	_appendColumnHeaders();
	model.forEachRow(_appendRowEditor);

	model.events.on('change:append', function(range, rows) {
		rows.forEach(_appendRowEditor);
	});

	model.events.on('change:remove', function(range, rows) {
		var limit = range.endRow - range.startRow;
		while (limit--) {
			ui.body.removeChild(ui.body.childNodes[range.startRow]);
		}
	});

	ev.delegate(ui.body, 'click', '[data-command="delete-row"]', function(evt) {
		var target = evt.delegateTarget;
		while (target.nodeName.toLowerCase() !== 'tr') {
			target = target.parentNode;
		}
		for (var i = 0; i < ui.body.childNodes.length; ++i) {
			if (ui.body.childNodes[i] === target) {
				model.deleteRowAtIndex(i);
				break;
			}
		}
	});

	return {
		root: ui.root,
		addRow: function() {
			model.addRow();
		},
		deleteSelectedRow: function() {
			console.log("delete selected row");
		},
		'export': function() {
			var data = model.mapRows(function(row) {
				return opts.serializeRow(row, row.map(function(c) { return c.value; }));
			});
			console.log(data);
			return data;
		}
	};

	function _importData(model, ary) {
		var columnTypes = model.columnTypes;
		return ary.forEach(function(row) {
			row = row.map(function(value, columnIx) {
				return (value instanceof Cell)
					? value
					: new Cell(columnTypes[columnIx], value);
			});
			model.addRow(row);
		});
	}

	function _createRowEditor(row) {
		var editors = row.map(function(cell, ix) {
			var td = document.createElement('td');
			td.className = columnClasses[ix] || '';
			td.appendChild(cell.createEditor().root);
			return td;
		});
		var deleteRow = document.createElement('td');
		deleteRow.innerHTML = '<button data-command="delete-row">X</button>';
		editors.push(deleteRow);
		var ui = D('tr', editors);
		return ui.root;
	}

	function _appendColumnHeaders() {
		var header = D('tr', opts.columnHeaders.map(function(t) {
			return D('th', t);
		}));
		ui.head.appendChild(header.root);
	}

	function _appendRowEditor(row) {
		ui.body.appendChild(_createRowEditor(row));
	}
}