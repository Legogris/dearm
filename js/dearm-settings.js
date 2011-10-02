if(CM === undefined) { var CM = {}; }

CM.Settings = {
	BackgroundColor: '#000',
	ViewWidth: 800,
	ViewHeight: 600,
	VariableCount: 4
};


if(typeof module != 'undefined') {
    module.exports = CM.Settings;
}