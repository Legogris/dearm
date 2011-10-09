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
          var am = undefined;
          var sBit = undefined;
          var regList = undefined;
          var dataType = undefined;
          var offset = undefined;
          while(state != States.afterIns) {
            bits = '';
            switch(state) {
              case States.beforeIns:
                var insBits = padZeroes(data[i].toString(2), 32);
                //console.log("Starting " + a + ": " + insBits);
                state = States.beforeCond;
                break;
              case States.beforeCond:
                var condBits = insBits.slice(0, 4);
                var cond = condBits.slice(0, 3) == '111' ? null : Conditions[condBits];
                state = States.afterCond;
                break;
              case States.afterCond:
                bits = headBits = insBits.slice(4, 6);
                immediate = parseInt(insBits[6], 2);
                switch(bits) {
                  case '00':
                    if(!immediate && insBits[24] == '1' && insBits[27] == '1') {
                      if(insBits[25] == '0' && insBits[26] == '0') {
                        state = States.unimplemented; // Multiply / SWP
                      } else {
                        state = States.beforeLDRSTR;
                        aMode = 3;
                      }
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
                    if(immediate) {
                      state = States.beforeBranch;
                    } else {
                      aMode = 4;
                      state = States.beforeLDRSTR;
                    }
                    break;
                  case '11':
                    if(immediate) {
                      state = States.beforeSWI;
                    } else {
                      state = States.unimplemented; // TODO:Coprocessor DP and register transfer 
                    }
                    break;
                }
                break;
              case States.beforeDP: //Data processing
                bits = insBits.slice(7, 11);
                mem = OpCodes[bits];   
                setsFlags = parseInt(insBits[11], 2);
                if(bits.slice(0, 2) == '10') { //CMP, CMN, TST or TEQ
                  if(setsFlags) { 
                    setsFlags = false;  //Always set flags so no need to specify - the only thing this is used for ATM is setting S
                  } else {
                    state = States.unimplemented; //Move immediate to status register
                  }
                }
                //console.log(mem + " @ " + a);
                state = States.afterDP;
                break;
              case States.afterDP:
                state = States.beforeRn;
                break;
              case States.beforeLDRSTR:
                bits = insBits.slice(7, 12);
                mem = ['ST', 'LD'][parseInt(bits[4], 2)];
                var preIndexing = bits[3] == '1';
                var offsetOperator = bits[1] == '0' ? '-' : '+';
                var postIndexing = bits[0] == '0';
                switch(aMode) {
                  case 2:  //Normal LDR / STR
                    mem += 'R';
                    if(!immediate) {
                      offsetType = Offsets.Imm;
                    }
                    dataType = ['', 'B'][parseInt(bits[2], 0)];
                    if(postIndexing && preIndexing) { //Bit 21 has different meaning under post-indexing
                      dataType += 'T'; //Unprivileged access
                      preIndexing = false;
                    }
                    state = States.beforeRn;
                    break;
                  case 3: // H/SH/SB
                    mem += 'R';
                    offsetType = [Offsets.Reg, Offsets.Imm][parseInt(bits[2], 2)];
                    if(postIndexing && preIndexing) {
                      mem = 'UNPREDICTABLE';
                      state = States.finished;
                      break;
                    }
                    state = States.beforeRn;
                    break;
                  case 4: //LDM/STM
                    mem += 'M';
                    am = ['D', 'I'][parseInt(bits[1], 2)];
                    am += ['A', 'B'][parseInt(bits[0], 2)];
                    sBit = parseInt(bits[2], 2);
                    state = States.beforeRn;
                    break;
                  default:
                    state = States.unimplemented;
                    break;
                }
                break;
              case States.beforeBranch:
                mem = insBits[7] == '1' ? 'BL' : 'B';
                bits = insBits.slice(8, 32);
                var offset = ( bits[0] == '1' ? -(0x1000000 - parseInt(bits, 2)) : parseInt(bits, 2) ) << 2;
                immediate = a+8+offset;
                state = States.finished;
                break;
              case States.beforeSWI:
                mem = 'SWI';
                bits = insBits.slice(8, 32);
                immediate = parseInt(bits, 2);
                state = States.finished;
                break;
              case States.beforeRn:
                bits = insBits.slice(12, 16);
                rn = parseInt(bits, 2);
                state = States.afterRn;
                break;
              case States.afterRn:
                switch(aMode) {
                  case 1:
                    if(insBits.slice(7, 9) == '10') {
                      state = States.afterRd;       ////CMP, CMN, TST or TEQ does not have Rd
                      break;
                    }
                    state = States.beforeRd;
                    break;
                  case 4:
                    state = States.beforeRegList;
                    break;
                  default:
                    state = States.beforeRd;
                } 
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
                    } else {
                      encoding = insBits[27] == '1' ? Encodings.RegShift : Encodings.ImmShift;
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
                  case 3:
                    bits = insBits.slice(20, 32);
                    dataType = ['B', 'H', 'SB', 'SH'][parseInt(bits.slice(5,7), 2)];
                    if(offsetType == Offsets.Imm) {
                      encoding = Encodings.Imm;
                      state = States.beforeOffset_8;
                    } else { //Register offset
                      encoding = Encodings.Reg;
                      state = States.beforeRm;
                    }
                    break;
                  default:
                    state = States.unimplemented;
                    break;
                }
                break;
              case States.beforeRegList:
                var regBits = insBits.slice(16, 32);
                regList = [];
                for(var j = 0; j < regBits.length; j++) {
                  if(regBits[regBits.length - j - 1] == '1') {
                    regList.push(Registers[j]);
                  }
                }
                state = States.finished;
                break;
              case States.beforeShift:
                bits = insBits.slice(20, 32);
                switch(aMode) {
                  case 1:
                    switch(encoding) {
                      case Encodings.Imm:
                        immediate = parseInt(bits.slice(4, 12), 2);
                        rotate = parseInt(bits.slice(0, 4), 2);
                        state = States.finished;
                        break;
                      case Encodings.ImmShift:
                        shift = Shifts[bits.slice(5, 7)];
                        immediate = parseInt(bits.slice(0, 5), 2);
                        state = States.beforeRm;
                        break;
                      case Encodings.RegShift:
                        shift = Shifts[bits.slice(5, 7)];
                        rs = parseInt(bits.slice(0, 4), 2);
                        state = States.beforeRm;
                        break;
                    }
                    break;
                  case 2:
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
                    state = States.beforeRm;
                    break;
                  default:    
                    state = States.unimplemented;
                }
                break;
              case States.beforeOffset_8:
                offset = parseInt(insBits.slice(20, 24)+insBits.slice(28, 32), 2);
                state = States.finished;
                break;
              case States.beforeOffset_12: 
                bits = insBits.slice(20, 32);
                offset = parseInt(bits, 2);
                state = States.finished;
                break;
              case States.beforeRm:
                bits = insBits.slice(28, 32);
                rm = parseInt(bits, 2);
                state = States.finished;
                break;
              case States.unimplemented:
                ins = bits;
                state = States.finished;
                break;
              case States.finished:
                ins = Format( { aMode: aMode, mem: mem, setsFlags: setsFlags, cond: cond, rotate: rotate, rd: rd, rn: rn, rm: rm, rs: rs, immediate: immediate, encoding: encoding, offsetOperator: offsetOperator, offset: offset, shift: shift, offsetType: offsetType, address: a, am : am, regList: regList, sBit: sBit, preIndexing: preIndexing, postIndexing: postIndexing, dataType: dataType});
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
        console.log("error: " + ex.stack);
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
