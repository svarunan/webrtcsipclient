var faxElement = {
	fax_gateway: 	document.getElementById("fax_gateway"),
	fax_file : 	   	document.getElementById("fax_file"),
	fax_src: 		document.getElementById("fax_src"),
	fax_dst: 		document.getElementById("fax_dst"),
	fax_send: 		document.getElementById("fax_send"),
	dps_div: 		document.getElementById("dps_div"),
	dps_form: 		document.getElementById("dps_form"),
}

faxElement.dps_form.addEventListener('submit', function(e){
	var path = document.getElementById('fileToUpload').value.toLowerCase();
	if(path.substr(-4) == 'jpeg' || path.substr(-4) == 'html'|| path.substr(-3) == 'pdf' 
		|| path.substr(-3) == 'jpg' || path.substr(-3) == 'tif' || path.substr(-4) == 'tiff'){
		console.info('Valid file');
	setTimeout(function(){
		alert('Sorry this is taking so long.');
		e.preventDefault();
	},60000)
	}else{
		alert('Invalid file extension');
		e.preventDefault();
		document.getElementById('fileToUpload').value = "";
	}
},false);

faxElement.fax_send.addEventListener('submit', function (e){
	e.preventDefault();
	if(!faxElement.fax_dst.value) return;
	var faxconf = {
		"file": 	"test.TIF",
		"provider": faxElement.fax_gateway.value,
		"from": 	faxElement.fax_src.value,
		"to": 		faxElement.fax_dst.value
	}
	if(faxElement.fax_file.value) // check if other tiff file is given
		faxconf.file = faxElement.fax_file.value;
	console.log(faxconf);
	socket.emit('fax',faxconf);
	
},false);
