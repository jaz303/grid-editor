module.exports = Model;

var EventBox = require('event-box');
var Cell = require('./Cell');

function Range(model, startColumn, startRow, endColumn, endRow) {
	this.model = model;
	this.startColumn = startColumn;
	this.startRow = startRow;
	this.endColumn = endColumn;
	this.endRow = endRow;
}

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