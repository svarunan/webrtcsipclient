var smsElement = {
	sms_form : document.getElementById("sms_form"),
	sms_gateway : document.getElementById("sms_gateway"),
	sms_text: document.getElementById("sms_text"),
	from: document.getElementById("sms_src"),
	to: document.getElementById("sms_dst"),
	sms_length: document.getElementById("sms_length"),
};
function sms_length(){
	if(smsElement.sms_text.value.length > 160){ 
		console.log("1")
		smsElement.sms_text.value = smsElement.sms_text.value.substring(0,160)
	}
	document.getElementById("sms_length").innerHTML = (160 - smsElement.sms_text.value.length);
};
function sms_status_clear(){
	document.getElementById('sms_status').innerHTML = "";
}
smsElement.sms_form.addEventListener('submit', function(e){
	e.preventDefault();
	socket.emit('sms', {
		"sms_gateway":smsElement.sms_gateway.value,
		"sms_text":smsElement.sms_text.value,
		"from":smsElement.from.value,
		"to":smsElement.to.value
	});
},false);