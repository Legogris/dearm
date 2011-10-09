Format = function(i) {
  i.rn = i.rn !== undefined ? Registers[i.rn] : undefined;
  i.rd = i.rd !== undefined ? Registers[i.rd] : undefined;
  i.rm = i.rm !== undefined ? Registers[i.rm] : undefined;
  i.rs = i.rs !== undefined ? Registers[i.rs] : undefined;
  var ins = i.mem + 
    (i.cond ? i.cond : '') + 
    (i.dataType ? i.dataType : '') + 
    (i.am ? i.am : '') + 
    (i.halfWord ? 'H' : i.byte ? 'B' : '') + 
    (i.setsFlags ? 'S' : '') +
    '\t' + 
    (i.rd !== undefined ? i.rd + ', ' : '');
  switch(i.aMode) {
    case 1:
      switch(i.mem) {
        case 'MOV':     //MOV{<cond>}{S} <Rd>, <shifter_operand>
        case 'MVN': 
        case 'CLZ':     //CLZ{<cond>} <Rd>, <Rm>
        case 'REV':
        case 'REV16':
        case 'REVSH':
        case 'CPY':
          break;
        case 'ADC':     //ADC{<cond>}{S} <Rd>, <Rn>, <shifter_operand>
        case 'ADD':
        case 'AND':
        case 'BIC':
        case 'EOR':
        case 'ORR':
        case 'RSC':
        case 'RSB':
        case 'SBC':
        case 'SUB':
        case 'QADD16':  //QADD16{<cond>} <Rd>, <Rn>, <Rm>
        case 'QADD8':
        case 'QADDSUBX':
        case 'QSUB16':
        case 'QQSUB8':
        case 'SADD16':
        case 'SADD8':
        case 'SADDSUBX':
        case 'QSUBADDX':
        case 'SEL':
        case 'SHADD16':
        case 'SHADD8':
        case 'SHADDSUBX':
        case 'SHSUB16':
        case 'SHSUB8':
        case 'SHSUBADDX':
        case 'SSUB16':
        case 'SSUB8':
        case 'SSUBADDX':
        case 'UADD16':
        case 'UADD8':
        case 'UADDSUBX':
        case 'UHADD16':
        case 'UHADD8':
        case 'UHADDSUBX':
        case 'UHSUB16':
        case 'UHSUB8':
        case 'UHSUBADDX':
        case 'UQADD16':
        case 'UQADD8':
        case 'UQADDSUBX':
        case 'UQSUB16':
        case 'UQSUB8':
        case 'UQSUBADDX':
        case 'USUB16':
        case 'USUB8':
        case 'USUBADDX':
        case 'CMN':     //CMN{<cond>} <Rn>, <shifter_operand>
        case 'CMP':
        case 'TEQ':
        case 'TST':
          ins += (i.rn !== undefined ? i.rn + ', ': ''); 
          break;
        case 'QADD': // QADD{<cond>} <Rd>, <Rm>, <Rn>
        case 'QDADD':
        case 'QDSUB':
        case 'QSUB':
        case 'STREX':
        case 'SWP':
          ins += (i.rm !== undefined ? i.rm + ', ': '') + 
            (i.rn !== undefined ? i.rn + ', ': '');
          break;
        default:
          ins += '//undefined, rn' + i.rn + ', rd' + i.rd + ', rm' + i.rm;
          break;
        }
        switch(i.encoding) {
          case Encodings.Imm:
            //ins += '#0x' + i.immediate.toString(16)
            //ins += i.rotate == 0 ? '' : ' 0x'+(i.rotate*2).toString(16);
            ins += '#0x' + (i.rotate ? bit_ror(i.immediate, i.rotate*2).toString(16) : i.immediate.toString(16));
            break;
          case Encodings.ImmShift:
            ins += i.rm + (i.immediate ? ' ' + i.shift + ' #0x' + i.immediate.toString(16) : '');
            break;
          case Encodings.RegShift:
            ins += i.rm + ' ' + i.shift + ' ' + i.rs;
            break;
          default:
            ins += '//mystery: ' + i.encoding;
            break;
        }
      break;
    case 2:
    case 3:
      var addr = '[';
      switch(i.offsetType) {
        case Offsets.Imm:
          if(i.rn == 'pc' && !i.postIndexing && !i.preIndexing) {
            var pc = (i.address + 8); 
            pc += i.offsetOperator == '-' ? -i.offset : i.offset; 
            addr += '$' + padZeroes(pc.toString(16), 8);
          } else {
            addr += i.rn;
            if(i.postIndexing) {
              addr += ']';
            }
            if(i.offset) {
              addr += ', #' + i.offsetOperator + '0x' + i.offset.toString(16);
            }
          }
          break;
        case Offsets.Reg:
        case Offsets.Scaled:
          addr += i.rn + (i.postIndexing ? '], ' : ', ') + i.offsetOperator + i.rm;
          if(i.offsetType == Offsets.Scaled) {
            addr += ', ' + i.shift + '#0x' + i.immediate.toString(16);
          }
          break;
      }
      if(!i.postIndexing) {
        addr += ']';
        if(i.preIndexing) {
          addr += '!';
        }
      }
      ins += addr;
      break;
    case 4:
      ins += i.rn + 
        (i.preIndexing ? '!' : '') + ', {';
      var first = true;
      i.regList.each(function(r, i) {
        if(first) { first = false; } else { ins += ', '; }
        ins += r;
      });
      ins += '}' +
        (i.sBit ? '^' : '');
      break;
    default: //B, BL
      ins += '0x' + padZeroes(i.immediate.toString(16), 8);
      break;
  };
  return ins;
};


var padZeroes = function(val, length) {
  while(val.length < length) {
    val = '0' + val;
  }
  return val;
};

var bit_ror = function(val, n) {
    return (val >>> n) | (val << (32 - n) & 0xFFFFFFFF);
};
