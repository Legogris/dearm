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
  beforeRegList: 21,
  beforeBranch: 22
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

Registers = [
'r0',
'r1',
'r2',
'r3',
'r4',
'r5',
'r6',
'r7',
'r8',
'r9',
'r10',
'fp',
'ip',
'sp',
'lr',
'pc'
];

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
