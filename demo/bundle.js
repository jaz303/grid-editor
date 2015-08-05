(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jason/dev/projects/grid-editor/Cell.js":[function(require,module,exports){
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
},{"./constants":"/Users/jason/dev/projects/grid-editor/constants.js"}],"/Users/jason/dev/projects/grid-editor/Model.js":[function(require,module,exports){
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
},{"./Cell":"/Users/jason/dev/projects/grid-editor/Cell.js","./constants":"/Users/jason/dev/projects/grid-editor/constants.js","event-box":"/Users/jason/dev/projects/grid-editor/node_modules/event-box/index.js"}],"/Users/jason/dev/projects/grid-editor/constants.js":[function(require,module,exports){
exports.INVALID = {};
},{}],"/Users/jason/dev/projects/grid-editor/demo/main.js":[function(require,module,exports){
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
},{"..":"/Users/jason/dev/projects/grid-editor/index.js"}],"/Users/jason/dev/projects/grid-editor/index.js":[function(require,module,exports){
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
		model = new Model(opts.columnTypes, {
			data: opts.data || []
		});
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
		'export': function() {
			var data = model.mapRows(function(row) {
				return opts.serializeRow(row.map(function(c) {
					return c.isValid() ? c.value : null;
				}), row);
			});
			console.log(data);
			return data;
		}
	};

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
},{"./Cell":"/Users/jason/dev/projects/grid-editor/Cell.js","./Model":"/Users/jason/dev/projects/grid-editor/Model.js","dom-bind":"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/index.js","dom-build":"/Users/jason/dev/projects/grid-editor/node_modules/dom-build/index.js"}],"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/index.js":[function(require,module,exports){
var matches = require('dom-matchesselector');

var bind = null, unbind = null;

if (typeof window.addEventListener === 'function') {

	bind = function(el, evtType, cb, useCapture) {
		el.addEventListener(evtType, cb, useCapture || false);
		return cb;
	}

	unbind = function(el, evtType, cb, useCapture) {
		el.removeEventListener(evtType, cb, useCapture || false);
		return cb;
	}

} else if (typeof window.attachEvent === 'function') {

	bind = function(el, evtType, cb, useCapture) {
		
		function handler(evt) {
			evt = evt || window.event;
			
			if (!evt.preventDefault) {
				evt.preventDefault = function() { evt.returnValue = false; }
			}
			
			if (!evt.stopPropagation) {
				evt.stopPropagation = function() { evt.cancelBubble = true; }
			}

			cb.call(el, evt);
		}
		
		el.attachEvent('on' + evtType, handler);
		return handler;
	
	}

	unbind = function(el, evtType, cb, useCapture) {
		el.detachEvent('on' + evtType, cb);
		return cb;
	}

}

function delegate(el, evtType, selector, cb, useCapture) {
	return bind(el, evtType, function(evt) {
		var currTarget = evt.target;
		while (currTarget && currTarget !== el) {
			if (matches(selector, currTarget)) {
				evt.delegateTarget = currTarget;
				cb.call(el, evt);
				break;
			}
			currTarget = currTarget.parentNode;
		}
	}, useCapture);
}

function bind_c(el, evtType, cb, useCapture) {
	cb = bind(el, evtType, cb, useCapture);

	var removed = false;
	return function() {
		if (removed) return;
		removed = true;
		unbind(el, evtType, cb, useCapture);
		el = cb = null;
	}
}

function delegate_c(el, evtType, selector, cb, useCapture) {
	cb = delegate(el, evtType, selector, cb, useCapture);

	var removed = false;
	return function() {
		if (removed) return;
		removed = true;
		unbind(el, evtType, cb, useCapture);
		el = cb = null;
	}
}

exports.bind = bind;
exports.unbind = unbind;
exports.delegate = delegate;
exports.bind_c = bind_c;
exports.delegate_c = delegate_c;
},{"dom-matchesselector":"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/node_modules/dom-matchesselector/index.js"}],"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/node_modules/dom-matchesselector/index.js":[function(require,module,exports){
var proto = window.Element.prototype;
var nativeMatch = proto.webkitMatchesSelector
					|| proto.mozMatchesSelector
					|| proto.msMatchesSelector
					|| proto.oMatchesSelector;

if (nativeMatch) {
	
	module.exports = function(selector, el) {
		return nativeMatch.call(el, selector);
	}

} else {

	console.warn("Warning: using slow matchesSelector()");
	
	var indexOf = Array.prototype.indexOf;
	module.exports = function(selector, el) {
		return indexOf.call(document.querySelectorAll(selector), el) >= 0;
	}

}

},{}],"/Users/jason/dev/projects/grid-editor/node_modules/dom-build/index.js":[function(require,module,exports){
module.exports = dombuild;

var bind = require('dom-bind').bind;

var PIXELS = {

    fontSize            : true,

    top                 : true,
    right               : true,
    bottom              : true,
    left                : true,

    width               : true,
    minWidth            : true,
    maxWidth            : true,

    height              : true,
    minHeight           : true,
    maxHeight           : true,

    outlineWidth        : true,

    margin              : true,
    marginTop           : true,
    marginRight         : true,
    marginBottom        : true,
    marginLeft          : true,

    padding             : true,
    paddingTop          : true,
    paddingRight        : true,
    paddingBottom       : true,
    paddingLeft         : true,

    borderTopWidth      : true,
    borderRightWidth    : true,
    borderBottomWidth   : true,
    borderLeftWidth     : true
    
};

function Result() {}

function dombuild(tag) {
    var state = new Result();
    state.root = builder(state, arguments);
    return state;
}

function builder(state, args) {
    var el = createElement(state, args[0]);
    append(state, el, args, 1);
    return el;
}

function append(state, el, items, startOffset) {
    for (var i = startOffset, len = items.length; i < len; ++i) {
        var item = items[i];
        while (typeof item === 'function') {
            item = item();
        }
        if (typeof item === 'string' || typeof item === 'number') {
            if (el.nodeType === 1) {
                el.appendChild(document.createTextNode(item));    
            } else if (el.nodeType === 3) {
                el.nodeValue += item;
            }
        } else if (item instanceof Result) {
            for (var k in item) {
                if (k === 'root') {
                    el.appendChild(item[k]);
                } else {
                    state[k] = item[k];
                }
            }
        } else if (Array.isArray(item)) {
            append(state, el, item, 0);
        } else if (!item) {
            continue;
        } else if (item.nodeType) {
            el.appendChild(item);
        } else {
            for (var k in item) {
                var v = item[k];
                if (typeof v === 'function' && k[0] === 'o' && k[1] === 'n') {
                    bind(el, k.substr(2), v);
                } else if (k === 'style') {
                    if (typeof v === 'string') {
                        el.style.cssText = v;
                    } else {
                        for (var prop in v) {
                            var propVal = v[prop];
                            if (typeof propVal === 'number' && PIXELS[prop]) {
                                propVal += 'px';
                            }
                            el.style[prop] = propVal;
                        }   
                    }
                } else {
                    el.setAttribute(k, v);
                }
            }
        }
    }
}

function createElement(state, tag) {

    if (tag.length) {
        var m;
        if ((m = /^([\w-]+)?(#[\w-]+)?((\.[\w-]+)*)(\![\w-]+)?$/.exec(tag))) {
            var el = document.createElement(m[1] || 'div');
            if (m[2]) el.id = m[2].substr(1);
            if (m[3]) el.className = m[3].replace(/\./g, ' ').trim();
            if (m[5]) state[m[5].substr(1)] = el;
            return el;
        } else if ((m = /^%text(\![\w-]+)?$/.exec(tag))) {
            var text = document.createTextNode('');
            if (m[1]) state[m[1].substr(1)] = text;
            return text;
        }
    }

    throw new Error("invalid tag");

}
},{"dom-bind":"/Users/jason/dev/projects/grid-editor/node_modules/dom-build/node_modules/dom-bind/index.js"}],"/Users/jason/dev/projects/grid-editor/node_modules/dom-build/node_modules/dom-bind/index.js":[function(require,module,exports){
module.exports=require("/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/index.js")
},{"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/index.js":"/Users/jason/dev/projects/grid-editor/node_modules/dom-bind/index.js"}],"/Users/jason/dev/projects/grid-editor/node_modules/event-box/index.js":[function(require,module,exports){
module.exports = EventBox;

var slice = Array.prototype.slice;

function _remove(ary, item) {
    if (ary) {
        for (var ix = 0, len = ary.length; ix < len; ix += 3) {
            if (ary[ix] === item) {
                ary.splice(ix, 3);
                return true;
            }
        }
    }
    return false;
}

function EventBox(validEvents) {
    this._validEvents = validEvents || null;
    this._eventHandlers = {};
}

EventBox.prototype.bind = function(obj, events) {
    if (events) {
        for (var i = 0; i < events.length; ++i) {
            this._on(events[i], obj, obj[events[i]], obj);
        }
    } else {
        for (var k in obj) {
            var handler = obj[k];
            if (typeof handler === 'function') {
                this._on(k, obj, handler, obj);    
            }
        }
    }
}

EventBox.prototype.unbind = function(obj) {

    var hnd = this._eventHandlers;
    if (!hnd) {
        return;
    }

    for (var k in hnd) {
        var lst = hnd[k];
        var i = 1, l = lst.length;
        while (i < l) {
            if (lst[i] === obj) {
                lst.splice(i-1, 3);
                l -= 3;
            } else {
                i += 3;
            }
        }
    }

}

EventBox.prototype.off = function(ev, cb) {

    var hnd = this._eventHandlers;
    if (!hnd) {
        return;
    }

    if (ev) {
        if (cb) {
            _remove(hnd[ev], cb);
        } else {
            hnd[ev] = [];
        }
    } else {
        this._eventHandlers = {};
    }

}

EventBox.prototype.on = function(ev, cb, ctx) {
    this._on(ev, null, cb, ctx || null);
    return cb;
}

EventBox.prototype.on_c = function(ev, cb, ctx) {
    var lst = this._on(ev, null, cb, ctx || null);

    var removed = false;
    return function() {
        if (removed) return;
        _remove(lst, cb);
        removed = true;
    }
}

EventBox.prototype.once = function(ev, cb, ctx) {
    ctx = ctx || null;
    function inner() { cancel(); cb.apply(ctx, arguments); }
    var cancel = this.on_c(ev, inner);
    return inner;
}

EventBox.prototype.once_c = function(ev, cb, ctx) {
    ctx = ctx || null;
    function inner() { cancel(); cb.apply(ctx, arguments); }
    var cancel = this.on_c(ev, inner);
    return cancel;
}

EventBox.prototype.emit = function(ev, arg1, arg2) {

    if (arguments.length > 3) {
        return this.emitArray(ev, slice.call(arguments, 1));
    }

    var hnds = this._eventHandlers;
    if (!hnds) return;

    var lst = hnds[ev];
    if (lst) {
        for (i = lst.length - 3; i >= 0; i -= 3) {
            lst[i].call(lst[i+2], arg1, arg2);
        }
    }

    lst = hnds['*'];
    if (lst) {
        for (i = lst.length - 3; i >= 0; i -= 3) {
            lst[i].call(lst[i+2], ev, arg1, arg2);
        }
    }

    var cix = ev.lastIndexOf(':');
    if (cix >= 0) {
        this.emit(ev.substring(0, cix), arg1, arg2);
    }

}

EventBox.prototype.emitArray = function(ev, args) {

    var hnds = this._eventHandlers;
    if (!hnds) return;
    
    var lst = hnds[ev];
    if (lst) {
        for (i = lst.length - 3; i >= 0; i -= 3) {
            lst[i].apply(lst[i+2], args);
        }
    }

    lst = hnds['*'];
    if (lst) {
        args = [ev].concat(args);
        for (i = lst.length - 3; i >= 0; i -= 3) {
            lst[i].apply(lst[i+2], args);
        }
    }

    var cix = ev.lastIndexOf(':');
    if (cix >= 0) {
        this.emitArray(ev.substring(0, cix), args);
    }

}

EventBox.prototype.emitAfter = function(delay, ev) {

    var self    = this,
        timer   = null,
        args    = slice.call(arguments, 2);

    timer = setTimeout(function() {
        self.emitArray(ev, args);
    }, delay);

    return function() { clearTimeout(timer); }

}

EventBox.prototype.emitEvery = function(interval, ev) {

    var self    = this,
        timer   = null,
        args    = slice.call(arguments, 2);

    var timer = setInterval(function() {
        self.emitArray(ev, args);
    }, interval);

    return function() { clearInterval(timer); }

}

//
// Internal

EventBox.prototype._on = function(ev, userData, cb, ctx) {

    if (this._validEvents && this._validEvents.indexOf(ev) < 0) {
        throw new Error("no such event: " + ev);
    }
    
    var hnds    = this._eventHandlers || (this._eventHandlers = {}),
        lst     = hnds[ev] || (hnds[ev] = []);

    lst.push(cb, userData, ctx);

    return lst;

}

},{}]},{},["/Users/jason/dev/projects/grid-editor/demo/main.js"]);
