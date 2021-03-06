module.exports = Model;

var INVALID = require('./constants').INVALID;

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

var EventBox = require('event-box');
var Cell = require('./Cell');

function Range(model, startColumn, startRow, endColumn, endRow) {
	this.model = model;
	this.startColumn = startColumn;
	this.startRow = startRow;
	this.endColumn = endColumn;
	this.endRow = endRow;
}

function Model(columnTypes, opts) {
	opts = opts || {};
	this.columnTypes = columnTypes.map(type);
	if (opts.cells) {
		this.data = opts.cells;
	} else if (opts.data) {
		this.data = opts.data.map(function(row) {
			return this._castRow(row);
		}, this);
	}
	this.events = new EventBox();
}

Object.defineProperty(Model.prototype, 'width', {
	get: function() { return this.columnTypes.length; }
});

Object.defineProperty(Model.prototype, 'height', {
	get: function() { return this.data.length; }
});

Model.prototype.forEachRowValues = function(cb) {
	this.data.forEach(function(row, ix) {
		cb(row.map(function(cell) { return cell.value; }, ix));
	});
}

Model.prototype.forEachRow = function(cb) {
	this.data.forEach(function(row, ix) {
		cb(row, ix);
	});
}

Model.prototype.mapRowValues = function(cb) {
	return this.data.map(function(row, ix) {
		return cb(row.map(function(c) { return c.value; }), ix);
	});
}

Model.prototype.mapRows = function(cb) {
	return this.data.map(function(row, ix) {
		return cb(row, ix);
	});
}

Model.prototype.addRow = function(row) {
	var ix = this.height;
	var newRow = row ? this._castRow() : this._createRow();
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

Model.prototype._castRow = function(ary) {
	return ary.map(function(item, ix) {
		return (item instanceof Cell)
			? item
			: new Cell(this._typeForColumn(ix), item);
	}, this);
}

Model.prototype._typeForColumn = function(ix) {
	return this.columnTypes[ix];
}