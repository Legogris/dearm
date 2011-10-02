CM.Gate = new Class({
	Implements: [Options],
	type: 0,
	symbol: '',
	reverses: false,
	inputCount: 1,
	width: 30,
	height: 30,
	x: 0,
	y: 0,
	id: undefined,
	inValues: [],
	inElements: [],
	outValue: undefined,
	element: undefined,
	lineColor: '#e22',
	options: {
		onUpdate: function(options) {
			this.setOptions(options);
		}
	},
	initialize: function(id, options) {
		var self = this;
		self.setOptions(options);
		self.id = id;
	},
	generateElement: function(withHooks) {
    var e = new Element('div', {id: 'gt'+this.name, class: 'gate', html: this.symbol});
    e.setStyles({
      width: this.width+'px',
      height: this.height+'px'
    });
    if(this.reverses) {
		  var s = new Element('span', {text: 'o', class: 'negator'});
			s.setStyles({
			  top: (this.height/2-5)+'px'
			});
		  e.adopt(s);
		}
		if(withHooks) {
			for(var i = 0; i < this.inputCount; i++) {
				var r = new Element('select', {class: 'input gateInput'}).adopt(new Element('option', {value: 0, text: '0'}), new Element('option', {value: 1, text: '1'}));
				if(this.inputCount == 1) {
					r.setStyle('top', (this.height)/2-5+'px');
				} else {
					r.setStyle('top', ((this.height+10)/this.inputCount)*i+'px'); //+oofsett to compensate for padding
				}
				r.addEvent('mousedown', function(e) {e.stopPropagation();});
				r.addEvent('change', function() {CM.Execute();});
				this.inElements.push(r);
				e.adopt(r);
			}
			var r = new Element('span', {id: 'output'+this.id, class: 'output', text: this.id});
			r.setStyles({
			  top: (this.height/2-5)+'px'
			});
			if(this.reverses) {
			  r.addClass('nOutput');
			}
			e.adopt(r)
		}
		return e;
	},
	place: function(pos) {
		this.element = this.generateElement(true);
		this.element.setPosition(pos);
		var drag = new Drag.Move(this.element, {
			container: $('dfArea'),
			onDrop: function() {
				CM.UIManager.DrawLines();
			},
      onDrag: function() {
        CM.UIManager.DrawLines();
      }
		});
		CM.UIManager.PlaceGate(this);
	}
});

CM.Invertor = new Class({
    Implements: [CM.Gate],
    name: 'Inverterare',
    type: 1,
    height: 20,
    inputCount: 1,
    reverses: true,
    symbol: '1',
    execute: function() {
        return !this.inValues[0];
    }
});

CM.AND = new Class({
    Implements: [CM.Gate],
    name: '2-ing AND',
    type: 3,
    inputCount: 2,
    reverses: false,
    symbol: '&',
		lineColor: '#22e',
    execute: function() {
        return this.inValues[0] && this.inValues[1];
    }
});

CM.NAND = new Class({
    Implements: [CM.AND],
    name: '2-ing NAND',
    type: 2,
    reverses: true,
		lineColor: '#22e',
    execute: function() {
        return !(this.inValues[0] && this.inValues[1]);
    }
});

CM.OR = new Class({
    Implements: [CM.Gate],
    name: '2-ing OR',
    type: 7,
    inputCount: 2,
    reverses: false,
    symbol: '&ge; 1',
		lineColor: '#2ee',
    execute: function() {
        return this.inValues[0] || this.inValues[1];
    }
});

CM.NOR = new Class({
    Implements: [CM.OR],
    name: '2-ing NOR',
    type: 4,
    reverses: true,
    execute: function() {
        return !(this.inValues[0] || this.inValues[1]);
    }
});

CM.NAND3 = new Class({
    Implements: [CM.AND],
    name: '3-ing NAND',
    type: 5,
    height: 60,
    inputCount: 3,
    reverses: true,
		lineColor: '#22e',
    execute: function() {
        return !(this.inValues[0] && this.inValues[1] && this.inValues[2]);
    }
});

CM.XOR = new Class({
    Implements: [CM.Gate],
    name: 'XOR',
    type: 6,
    inputCount: 2,
    reverses: false,
    symbol: '= 1',
		lineColor: '#e2e',
    execute: function() {
        return this.inValues[0] ^ this.inValues[1];
    }
});

CM.GateTypes = [CM.Invertor, CM.AND, CM.NAND, CM.NOR, CM.NAND3, CM.XOR, CM.OR];
