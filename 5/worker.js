onmessage = function(e){
	if ( e.data === "start" ) {
		// Do some computation
		postMessage({foo:"bar"});
	}
};