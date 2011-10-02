var CM = function() {
  var Init = function() {
    CM.UIManager.InitUI();
  };
  return {
    DN: {},
    Components: {},
    UIManager: {},
    Settings: {},
    Strings: {},
    KeyboardListener: {},
    State: {
      Variables: {},
    },
    DebugA: null,
    DebugB: null,

    Init: Init,
    SaveFile: function() {
        var data = '\r\n';
        var uriData = "data:application/octet-stream," + encodeURIComponent(data);
        var win = window.open(uriData, 'fileWindow');
    }
  };
} ();

function padZeroes(val, length) {
  while(val.length < length) {
    val = '0' + val;
  }
  return val;
}
function bit_ror(val, n) {
  return (val >>> n) | (val << (32 - n) & 0xFFFFFFFF);
}
CM.NetMan = function() {
  return {
  };
}();
CM.UIManager = function() {
  var clean = function() {
  };
  var handleFileSelect = function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var result = e.target.result;
	var data = new Uint32Array(result);
	var raw = '';
	var asm = '';
        var result = [];
        console.log(data.length);
        for(var i = 0; i < data.length; i++) {
          var ins = '';
          var bits = '';
          var a = (i*4);
          var headBits = undefined;
          var aMode = undefined;
          var setsFlags = false;
          var cond = undefined;
          var mem = undefined;
          var rn = undefined;
          var rd = undefined;
          var rs = undefined;
          var rm = undefined;
          var rotate = undefined;
          var encoding = undefined;
          var immediate = undefined;
          var offsetType = undefined;
          var state = States.beforeIns;
          var shift = undefined;
          while(state != States.afterIns) {
            bits = '';
            switch(state) {
              case States.beforeIns:
                var insBits = padZeroes(data[i].toString(2), 32);
                //console.log("Starting " + a + ": " + insBits);
                state = States.beforeCond;
                break;
              case States.beforeCond:
                var condBits = insBits.slice(0, 3);
                var cond = condBits.slice(0, 3) == '111' ? null : Conditions[condBits];
                state = States.afterCond;
                break;
              case States.afterCond:
                bits = headBits = insBits.slice(4, 6);
                immediate = parseInt(insBits[6], 2);
                switch(bits) {
                  case '00':
                    if(!immediate && insBits[24] == '1' && insBits[27] == '1') {
                      state = States.unimplemented;
                    } else {
                      state = States.beforeDP;
                      aMode = 1;
                    }
                    break;
                  case '01':
                    if(insBits[6] == '1' && insBits[27] == '1') {
                      state = States.unimplemented; //TODO: Media instructions
                    } else {
                      aMode = 2;
                      state = States.beforeLDRSTR;
                    }
                    break;
                  case '10':
                  case '11':
                    state = States.unimplemented; //yet to be defined
                    break;
                }
                break;
              case States.beforeDP: //Data processing
                bits = insBits.slice(7, 11);
                mem = OpCodes[bits];   
                setsFlags = parseInt(insBits[11], 2) == 1;
                if(bits.slice(0, 2) == '10' && !setsFlags) { //CMP, CMN, TST or TEQ
                  state = States.unimplemented; //Move immediate to status register
                }
                //console.log(mem + " @ " + a);
                state = States.afterDP;
                break;
              case States.afterDP:
                state = States.beforeRn;
                break;
              case States.beforeLDRSTR:
                bits = insBits.slice(6, 12);
                if(bits[0] == '0') {
                  offsetType = Offsets.Imm;
                }
                var postIndexing = bits[1] == '0';
                var preIndexing = false;
                var offsetOperator = bits[2] == '0' ? '-' : '+';
                mem = bits[5] == '0' ? 'STR' : 'LDR';
                if(bits[3] == '1') {
                  mem += 'B';
                }
                if(bits[4] == '1') {
                  if(postIndexing) {
                    mem += 'T';
                  } else {
                    preIndexing = true;
                  }
                } 
                state = States.beforeRn;
                break;
              case States.beforeRn:
                bits = insBits.slice(12, 16);
                rn = parseInt(bits, 2);
                state = States.afterRn;
                break;
              case States.afterRn:
                if(aMode == 1 && insBits.slice(7, 9) == '10') {
                  state = States.afterRd;
                  break;
                } ////CMP, CMN, TST or TEQ does not have Rd
                state = States.beforeRd; 
                break;
              case States.beforeRd:
                bits = insBits.slice(16, 20);
                rd = parseInt(bits, 2);
                state = States.afterRd;
                break;
              case States.afterRd:
                switch(aMode) {
                  case 1:
                    if(immediate) {
                      encoding = Encodings.Imm;
                    } else { //before: 27 == 1
                      encoding = insBits[6] == '0' ? Encodings.RegShift : Encodings.ImmShift;
                    }
                    state = States.beforeShift;
                    break;
                  case 2:
                    if(offsetType == Offsets.Imm) {
                      state = States.beforeOffset_12;
                    } else {
                      state = States.beforeShift;
                    }
                    break;
                  default:
                    state = States.unimplemented;
                    break;
                }
                break;
              case States.beforeShift:
                bits = insBits.slice(20, 32);
                switch(aMode) {
                  case 1:
                    if(encoding == Encodings.Imm) {
                      immediate = parseInt(bits.slice(4, 12), 2);
                      rotate = parseInt(bits.slice(0, 4), 2);
                      state = States.afterShift;
                      break;
                    }
                  case 2:
                    rm = parseInt(bits.slice(8, 12), 2);
                    bits = bits.slice(0, 8);
                    if(bits == '00000000') {
                      offsetType = Offsets.Reg;
                    } else {
                      offsetType = Offsets.Scaled;
                      shift = Shifts[bits.slice(5, 7)];
                      immediate = parseInt(bits.slice(0, 5), 2);
                      if(immediate == 0) {
                        if(shift == 'ROR') {
                          shift = 'RRX';
                        } else if (shift != 'LSL') {
                          immediate = 32;
                        }
                      }
                    }
                    state = States.afterShift;
                    break;
                  default:    
                    state = States.unimplemented;
                }
                break;
              case States.afterShift:
                state = States.finished;
                break;
              case States.beforeOffset_12: 
                bits = insBits.slice(20, 32);
                var offset_12 = parseInt(bits, 2);
                state = States.finished;
                break;
              case States.unimplemented:
                ins = bits;
                state = States.finished;
                break;
              case States.finished:
                ins = Format( { aMode: aMode, mem: mem, setsFlags: setsFlags, cond: cond, rotate: rotate, rd: rd, rn: rn, rm: rm, immediate: immediate, encoding: encoding, offsetOperator: offsetOperator, offset_12: offset_12, shift: shift, offsetType: offsetType, address: a});
                result.push(ins);
                state = States.afterIns;
                break;
              case States.afterIns:
                state = States.beforeIns;
                break;
              default:
                console.log("In undefined state" + state);
                break;
            };
          }
        }
        result.each(function(ins, i) {
          var a = padZeroes((i*4).toString(16), 8);
          raw += a + "\t   " + padZeroes(data[i].toString(16), 8) + "\t" + padZeroes(data[i].toString(2), 32) + String.fromCharCode(13);
          asm += a + "\t" + ins + String.fromCharCode(13);
        });
        $('raw').set('html', raw);
        $('result').set('html', asm);
      } catch(ex) {
        alert('fail');
        console.log("error: " + ex);
      }
    };
    reader.onerror = function(e, er) {
      console.log(e.target.error);
      console.log(er);
      console.log(this);
    };
    reader.readAsArrayBuffer(file);
  };

  return {
		Context: undefined,
    InitUI: function() {
      var keyboardListener = new Keyboard({
        active: true
      });
      $$('a.returnFalse').addEvent('click', function(e) { return false; });
      $('menuFileNew').addEvent('click', function(e) { clean(); return false; });
      $('menuFileSave').addEvent('click', function(e) { CM.SaveFile(); });
      $('menuFileOpen').addEvent('click', function(e) {$('file').click();});
      CM.UIManager.KeyboardListener = keyboardListener;
			$('executeButton').addEvent('click', function(e) {
			  CM.Execute();
			});
      $('file').addEvent('change', handleFileSelect);
    }
  };
}();

window.addEvent('domready', CM.Init);