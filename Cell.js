module.exports = Cell;

var INVALID = require('./constants').INVALID;

function Cell(type, initialValue) {
	this.type = type;
	this.value = initialValue;
}

Cell.prototype.createEditor = function() {
	var editor = this.type.createEditor(this);
	editor.set(this.value);
	return editor;
}

Cell.prototype.isValid = function() {
	return this.value !== INVALID;
}