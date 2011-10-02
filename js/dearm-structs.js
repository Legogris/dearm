States = {
  init: 0,
  beforeIns: 1,
  inIns: 2,
  beforeOp: 3,
  inOp: 4,
  afterIns: 5,
  beforeCond: 6,
  inCond: 7,
  afterCond: 8,
  beforeDP: 9,
  afterDP: 10,
  unImplemented: 11,
  finished: 12, 
  beforeRn: 13,
  afterRn: 14,
  beforeRd: 15,
  afterRd: 16,
  beforeShift: 17,
  afterShift: 18,
  beforeLDRSTR: 19,
  beforeOffset_12: 20,
};

Conditions = {
  '0000': 'EQ',
  '0001': 'NE',
  '0010': 'CS',
  '0011': 'CC',
  '0100': 'MI',
  '0101': 'PL',
  '0110': 'VS',
  '0111': 'VC',
  '1000': 'HI',
  '1001': 'LS',
  '1010': 'GE',
  '1011': 'LT',
  '1100': 'GT',
  '1101': 'LE',
  '1110': 'AL'
};

Shifts = {
  '00': 'LSL',
  '01': 'LSR',
  '10': 'ASR',
  '11': 'ROR'
};

Format = function(i) {
  var ins = i.mem + 
    (i.cond ? i.cond : '') + 
    (i.halfWord ? 'H' : i.byte ? 'B' : '') + 
    (i.setsFlags ? 'S' : '') +
    '\t' + 
    (i.rd !== undefined ? 'r' + i.rd + ', ' : '');
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
          ins += (i.rn !== undefined ? 'r' + i.rn + ', ': ''); 
          break;
        case 'QADD': // QADD{<cond>} <Rd>, <Rm>, <Rn>
        case 'QDADD':
        case 'QDSUB':
        case 'QSUB':
        case 'STREX':
        case 'SWP':
          ins += (i.rm !== undefined ? 'r' + i.rm + ', ': '') + 
            (i.rn !== undefined ? 'r' + i.rn + ', ': '');
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
            //TODO
            ins += ' //todoImm';
            break;
          case Encodings.RegShift:
            ins += 'r' + i.rm;
            break;
          default:
            ins += '//mystery: ' + i.encoding;
            break;
        }
      break;
    case 2:
      var addr = '[';
      switch(i.offsetType) {
        case Offsets.Imm:
          if(i.rn == '15' && !i.postIndexing && !i.preIndexing) {
            var pc = (i.address + 8); 
            pc += i.offsetOperator == '-' ? -i.offset_12 : i.offset_12; 
            addr += '$' + padZeroes(pc.toString(16), 8);
          } else {
            addr += 'r' + i.rn;
            if(i.postIndexing) {
              addr += ']';
            }
            addr += ', #' + i.offsetOperator + '0x' + i.offset_12.toString(16);
          }
          break;
        case Offsets.Reg:
        case Offsets.Scaled:
          addr = 'r' + i.rn + (i.postIndexing ? '], ' : ', ') + i.offsetOperator + 'r' + i.rm;
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
    default:
      break;
  };
  return ins;
};

OpCodes = {
  '0000': 'AND',
  '0001': 'EOR',
  '0010': 'SUB',
  '0011': 'RSB',
  '0100': 'ADD',
  '0101': 'ADC',
  '0110': 'SBC',
  '0111': 'RSC',
  '1000': 'TST',
  '1001': 'TEQ',
  '1010': 'CMP',
  '1011': 'CMN',
  '1100': 'ORR',
  '1101': 'MOV',
  '1110': 'BIC',
  '1111': 'MVN'
};

Encodings = {
  Imm: 0,
  ImmShift: 1,
  RegShift: 2
};

Offsets = {
  Imm: 0,
  Reg: 1,
  Scaled: 2
};
