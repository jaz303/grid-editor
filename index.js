module.exports = gridEditor;

var D = require('dom-build');
var EventBox = require('event-box');
var ev = require('dom-bind');

var INVALID = {};

function textEditorForCell(cell, reprToValue, valueToRepr) {
	var el = document.createElement('input');
	el.type = 'text';

	el.onchange = function() {
		cell.value = reprToValue(this.value);
	};

	return {
		root: el,
		set: function(val) { el.value = valueToRepr(val); },
		teardown: function() {

		}
	};
}

var types = {
	'number': {
		name: 'number',
		defaultValue: function() { return INVALID; },
		createEditor: function(cell) {
			return textEditorForCell(
				cell,
				function(repr) {
					var val = parseFloat(repr);
					return isFinite(val) ? val : INVALID;
				},
				function(value) { 
					return (value === INVALID) ? '' : ('' + value);
				}
			);
		}
	},
	'string': {
		name: 'string',
		defaultValue: function() { return ''; },
		createEditor: function(cell) {
			return textEditorForCell(
				cell,
				function(repr) { return repr; },
				function(value) { return value; }
			);
		}
	}
};

function type(t) {
	return (typeof t === 'string') ? types[t] : t;
}

//
//

function Cell(type, initialValue) {
	this.type = type;
	this.value = initialValue;
}

Cell.prototype.createEditor = function() {
	var editor = this.type.createEditor(this);
	editor.set(this.value);
	return editor;
}

//
//

function Range(model, startColumn, startRow, endColumn, endRow) {
	this.model = model;
	this.startColumn = startColumn;
	this.startRow = startRow;
	this.endColumn = endColumn;
	this.endRow = endRow;
}

//
//

function Model(columnTypes, data) {
	this.columnTypes = columnTypes;
	this.data = data;
	this.events = new EventBox();
}

Object.defineProperty(Model.prototype, 'width', {
	get: function() { return this.columnTypes.length; }
});

Object.defineProperty(Model.prototype, 'height', {
	get: function() { return this.data.length; }
});

Model.prototype.forEachRow = function(cb) {
	this.data.forEach(cb);
}

Model.prototype.mapRows = function(cb) {
	return this.data.map(cb);
}

Model.prototype.addRow = function() {
	var ix = this.height;
	var newRow = this._createRow();
	this.data.push(newRow);
	this.events.emit('change:append', this.rowRange(ix, ix+1), [newRow]);
}

Model.prototype.deleteRowAtIndex = function(ix) {
	if (ix < 0 || ix >= this.height) return;
	var victim = this.data[ix];
	this.data.splice(ix, 1);
	this.events.emit('change:remove', this.rowRange(ix, ix+1), [victim]);
}

Model.prototype.rowRange = function(startRow, endRow) {
	return new Range(this, 0, startRow, Infinity, endRow);
}

Model.prototype._createRow = function() {
	var row = [];
	for (var i = 0, w = this.width; i < w; ++i) {
		row.push(new Cell(this.columnTypes[i], this.columnTypes[i].defaultValue()));
	}
	return row;
}

//
//

function gridEditor(opts) {

	var ui = D('table', D('thead!head'), D('tbody!body'));
	var columnTypes = opts.columnTypes.map(type);
	var columnClasses = opts.columnClasses || [];
	
	var model = new Model(
		columnTypes,
		_importData(opts.data || [], columnTypes)
	);

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

	function _importData(ary, columnTypes) {
		return ary.map(function(row) {
			return row.map(function(value, columnIx) {
				return (value instanceof Cell)
					? value
					: new Cell(columnTypes[columnIx], value);
			});
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