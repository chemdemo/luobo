function $(id, ctx) {
	return (ctx || document).getElementById(id);
}

function getRandomNum(max, base) {
	base = base || 0;
	return Math.floor((max+base)*Math.random());
}

function addEvt(el, evt, handle) {
	el.addEventListener(evt, handle, false);
}

function removeEvt(el, evt, handle) {
	el.removeEventListener(evt, handle, false);
}

function objSwap(o) {
	var tgt = {};
	
	for(var k in o) {
		if(o.hasOwnProperty(k)) {
			tgt[o[k]] = k;
		}
	}
	
	return tgt;
};

function log(msg) {
	console.log(msg);
}