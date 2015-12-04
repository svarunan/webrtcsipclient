var GUI = {
  uaForm:         document.getElementById('ua-form'),
  userId:         document.getElementById('user'),
  regExpire:      document.getElementById("reg_expire"),
  sipTrace:       document.getElementById("siptrace"),
  makeCall_div:   document.getElementById('makeCall'),
  calledNumber:   document.getElementById('outbound_id'),
  audioInvite:    document.getElementById('audio_call'),
  videoInvite:    document.getElementById('video_call'),
  gatewayList:    document.getElementById('voice_gateway'),
  user:           document.getElementById('user'),
  audioSrc:       document.querySelector('select#audioSrc'),
  videoSrc:       document.querySelector('select#videoSrc') 
}
var sipServer = CONF.serverip,
    user,
    phoneInstances = [], // All new SIP.UA goes here
    connection = {}, // All new connections goes here
    config = {
      register: false,
      password: CONF.sipPwd,
      wsServers: 'ws://'+sipServer[0]+':5066'
    };

(function($) {
  $.fn.engine = new function (){
    this.show_callbutton = function (e){
      GUI.makeCall_div.style.display = e || "";     
    }
    this.show_hangup = function (id){
      console.debug('Inside show_hangup');
      $('.callPanel').append('<div id="'+id+'_callPanel" style="display:;">'+
        '<br>'+
        '<h3 class="outboundcall">Outgoing: '+GUI.calledNumber.value+'</h3>'+
        '<audio id='+id+'_audio class="media_type" style="display: none;" controls> </audio>'+
        '<video id='+id+'_video class="media_type" style="display: none;" controls> </video>'+
        '<br>'+
        '<img class="hicon" id='+id+'_hangup onclick="engine.click_hangup(this.id)">'+
        '<img class="muteicon" id='+id+'_mute onclick="engine.click_mute(this.id)" style="display: none;">'+
        '<img id='+id+'_dialpadImage style="display: none;" class="dicon" onclick="engine.show_dialpad(this.id)">'+
        '<a id='+id+'_status class="status"></a>'+
        '<div id='+id+'_dialpad style="display: none;" class="dialpad">'+
          '<a class="keypad" id='+id+'_1>1</a>'+
          '<a class="keypad" id='+id+'_2>2</a>'+
          '<a class="keypad" id='+id+'_3>3</a>'+'<br>'+
          '<a class="keypad" id='+id+'_4>4</a>'+
          '<a class="keypad" id='+id+'_5>5</a>'+
          '<a class="keypad" id='+id+'_6>6</a>'+'<br>'+
          '<a class="keypad" id='+id+'_7>7</a>'+
          '<a class="keypad" id='+id+'_8>8</a>'+
          '<a class="keypad" id='+id+'_9>9</a>'+'<br>'+
          '<a class="keypad" id='+id+'_*>*</a>'+
          '<a class="keypad" id='+id+'_0>0</a>'+
          '<a class="keypad" id='+id+'_#>#</a>'+
        '</div>'+
        '</div>');
      this.get_keypad(); //Init keypad listerning 
    }
    this.show_answer_reject = function (id,media_type){
      console.debug('Inside show_answer_reject');
      $('.callPanel').append('<div id='+id+'_callPanel style="display:;">'+
        '<br>'+
        '<audio id='+id+'_audio class="media_type" style="display: none;" controls> </audio>'+
        '<video id='+id+'_video class="media_type" style="display: none;" controls> </video>'+
        '<br>'+
        '<img class="vicon" id='+id+'_Vanswer onclick="engine.click_Vanswer(this.id)" style="display: none;">'+
        '<img class="aicon" id='+id+'_Aanswer onclick="engine.click_Aanswer(this.id)">'+
        '<img class="hicon" id='+id+'_reject onclick="engine.click_reject(this.id)">'+
        '<img class="txicon" id='+id+'_transfer onclick=engine.genShowHide("'+id+'_transferdiv") style="display:none;">'+
        '<img class="hicon" id='+id+'_hangup onclick="engine.click_hangup(this.id)" style="display: none;">'+
        '<img class="muteicon" id='+id+'_mute onclick="engine.click_mute(this.id)" style="display: none;">'+
        '<img id='+id+'_dialpadImage style="display: none;" class="dicon" onclick="engine.show_dialpad(this.id)">'+
        '<a id='+id+'_status class="status"></a>'+
        '<div id='+id+'_dialpad style="display: none;" class="dialpad">'+
          '<a class="keypad" id='+id+'_1>1</a>'+
          '<a class="keypad" id='+id+'_2>2</a>'+
          '<a class="keypad" id='+id+'_3>3</a>'+'<br>'+
          '<a class="keypad" id='+id+'_4>4</a>'+
          '<a class="keypad" id='+id+'_5>5</a>'+
          '<a class="keypad" id='+id+'_6>6</a>'+'<br>'+
          '<a class="keypad" id='+id+'_7>7</a>'+
          '<a class="keypad" id='+id+'_8>8</a>'+
          '<a class="keypad" id='+id+'_9>9</a>'+'<br>'+
          '<a class="keypad" id='+id+'_*>*</a>'+
          '<a class="keypad" id='+id+'_0>0</a>'+
          '<a class="keypad" id='+id+'_#>#</a>'+       
        '</div>'+
        '<div id='+id+'_transferdiv style="display: none;">'+
          '<input type="text">'+
          '<select>'+
            '<option value="">Caller</option>'+
            '<option value="-bleg">You</option>'+
          '</select>'+
          '<button onclick=engine.click_transfer("'+id+'") style="color:mediumblue;cursor:pointer;">transfer</button>'+
        '</div>'+        
        '</div>');
      this.get_keypad(); //Init keypad listerning
      if(media_type && media_type == "video"){ // to display video icon on video call
        $('#'+id+"_Vanswer")[0].style.display = "";
      }      
    }
    this.show_hangup_mute = function (id,media_type){
      console.debug('Inside show_hangup_mute');
      var media = connection[id].getRemoteStreams()[0];
      $('#'+id+'_'+media_type)[0].src = URL.createObjectURL(media);
      $('#'+id+'_'+media_type)[0].play();
      $('#'+id+'_'+media_type)[0].style.display = "";
      $('#'+id+'_mute')[0].style.display = "";
      $('#'+id+'_hangup')[0].style.display = "";
      $('#'+id+'_dialpadImage')[0].style.display = "";
      if($('#'+id+'_transfer').length != 0){ // tranfer wont come for OB calls
        $('#'+id+'_transfer')[0].style.display = "";
      }
    }
    this._200ok = function (id,media_type){
      this.show_hangup_mute(id,media_type);
    }    
    this.remove_answer_reject = function (id){
      console.debug('Inside remove_answer_reject')
      $('#'+id+"_Aanswer").remove();
      $('#'+id+"_Vanswer").remove();
      $('#'+id+"_reject").remove();
    }
    this.remove_hangup = function (id){
      console.debug('Inside remove_hangup');
      $('#'+id+"_hangup").remove();
    }  
    this.call_off = function (id){
      console.debug('Inside call_off');
      $('#'+id+"_callPanel").fadeOut(1500,function(){
        $('#'+id+"_callPanel").remove(); // remove full callpanel div
        delete connection[id];
      });
    }
    this.click_Aanswer = function (id){
      var id = this.getId(id);
      console.debug('Inside click_Aanswer',id);
      connection[id].accept({    //accepting incoming call with audio
          media: {
              constraints: {
                  audio: {optional: [{sourceId: GUI.audioSrc.value}]},
                  video: false
              }  
          }
      });
    }
    this.click_Vanswer = function (id){
      var id = this.getId(id);
      console.debug('Inside click_Vanswer',id);
      connection[id].accept({    //accepting incoming call with audio
          media: {
              constraints: {
                  audio: {optional: [{sourceId: GUI.audioSrc.value}]},
                  video: {optional: [{sourceId: GUI.videoSrc.value}]}
              }  
          }
      });
    }    
    this.click_reject = function (id){
      var id = this.getId(id);
      console.debug('Inside click_reject',id);  
      var options = {
            statusCode: 486,
            reasonPhrase:"Busy Here"
          };
      connection[id].reject(options);
      console.debug('You rejected: ',engine.status(id,"You rejected"));
      this.call_off(id);
    }
    this.connReject = function (){
      return options = {
                        statusCode: 486,
                        reasonPhrase:"Connection Full"
              };
    } 
    this.click_hangup = function (id){
      var id = this.getId(id);
      console.debug('Inside click_hangup',id);
      connection[id].terminate();
      this.call_off(id);
    }
    this.click_mute = function (id){
      var id = this.getId(id);
      console.debug('Inside click_mute',id);
      if($('#'+id+'_mute')[0].className == "muteicon"){
        connection[id].mediaHandler.mute();
        $('#'+id+'_mute')[0].className = "unmuteicon";
        console.debug("Audio Muted");
      }else{
        connection[id].mediaHandler.unmute();
        console.debug("Audio unmuted");
        $('#'+id+'_mute')[0].className = "muteicon";
      }
    }
    this.click_transfer = function(id){
      console.debug('Inside click_transfer',id);
      var uuid = connection[id].request.getHeaders('X-Uuid'),
          leg = document.getElementById(id+'_transferdiv').querySelector('select').value
          txNumber = document.getElementById(id+'_transferdiv').querySelector('input').value
          message = uuid+"|"+leg+"|"+txNumber+"|"+user;
          console.debug(message);
          phone.message(user,message);
    }
    this.getId = function (str){
      return str.split('_')[0];
    }
    this.status = function (id,status){
      $('#'+id+'_status')[0].innerHTML = " "+status;
    }
    this.play_tone = function (id,tone,media_type){
      console.debug(id,tone,media_type);
      if(typeof tone == "object"){
        $('#'+id+'_'+media_type)[0].src = URL.createObjectURL(tone[0]);
      }else{
        $('#'+id+'_'+media_type)[0].src = "sounds/"+tone+".mp3";
      }
      $('#'+id+'_'+media_type)[0].play();
    }
    this.show_dialpad = function (id){
      var id = this.getId(id);
      if(document.getElementById(id+'_dialpad').style.display == "none"){ 
       document.getElementById(id+'_dialpad').style.display = "";
      }else{
       document.getElementById(id+'_dialpad').style.display = "none";
      }
    }
    this.get_keypad = function(){
      $(".keypad").click(function(){ //DTMF
        var id = $(this).attr('id').split('_')[0];
        var key = $(this).attr('id').split('_')[1];
        if(connection[id]){
          connection[id].dtmf(key);
          console.debug('DTMF : '+key);
          document.getElementById('dtmf-audio').play();
        }else{
          console.warn("No session for sending DTMF");
        }
      });
    }
    this.genShowHide = function (id){
      if(document.getElementById(id).style.display == "none"){ 
       document.getElementById(id).style.display = "";
      }else{
       document.getElementById(id).style.display = "none";
      }
    }
    this.connLimit = function (){
      if(Object.keys(connection).length == 3){ // Maximum connection limit is 3
        return "exceeded";
      }else{
        return "notexceeded";
      }
    }
    this.getMediaDevices = function (){
      if (typeof MediaStreamTrack.getSources === 'undefined') {
        alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
      } else {
        MediaStreamTrack.getSources(function(devices){
          console.info(devices);
          for (var i = 0; i < devices.length; i++) {
            var option = document.createElement('option');
            option.value = devices[i].id;
            option.text = devices[i].label || devices[i].kind+"-"+i;
            if (devices[i].kind === 'audio' || devices[i].kind === 'audioInput') {
              audioSrc.appendChild(option);
            } else if (devices[i].kind === 'video' || devices[i].kind === 'videoInput') {
              videoSrc.appendChild(option);
            } else {
              console.log('unknown', JSON.stringify(devices[i]));
            }
          }
        })
      }      
    }
  };
  $(".numFormat").change(function(){ //Number
    this.value  = this.value.replace(/[aA-zZ&\/\\#\-,\[\]\ \\^()$~%'_":*@?<>{}]/g, '');
  })

}(jQuery));
var engine = $().engine; // access engine constructor inside jquery

function inBoundCall(e){
  var media_type = "video";
  if(e.body.search('video') == -1){
    media_type = "audio";
  }
  e.call_id = e.from_tag
  e.caller_id = e.remoteIdentity.displayName+' | '+e.remoteIdentity.uri.user;
  connection[e.call_id] = e; //Push the call obj in connection array
  engine.show_answer_reject(e.call_id,media_type);
  engine.play_tone(e.call_id,"in-ring",media_type);
  engine.status(e.call_id,e.caller_id);
  var ibc = e // In bound Call
  ibc.on('accepted', function (e) {
    console.info(e);
    if(e.substr(e.search('mid:video')) != " " && e.substr(e.search('mid:video')).search('sendrecv') != -1){
      media_type = "video";
    }else{
      media_type = "audio";
      engine.play_tone(this.call_id,"mute","video");
    }
    engine.remove_answer_reject(this.call_id)
    engine.show_hangup_mute(this.call_id,media_type); 
    console.debug(this.caller_id+' : answered')
  });
  ibc.on('bye', function (e){
    if(e.server_transaction){ 
      console.debug(e.method,engine.status(this.call_id,'Receiver sent BYE'));
      }else{
        console.debug(e.method,engine.status(this.call_id,"You've sent BYE"));
      }
    engine.call_off(this.call_id);
    console.debug("Call ended");
  });
  ibc.on('failed', function (response,cause){
    if(typeof response == "object"){
      console.debug(engine.status(this.call_id, JSON.stringify(response.headers.Reason, response)));
    }else{
      console.debug(engine.status(this.call_id, response.split('\n')[0]), response);
    }
    engine.call_off(this.call_id);
  });
}

function outBoundCall(media_type){
  var uri = GUI.calledNumber.value,
      extraSipHeaders=[];
  if (!uri) return;
  if(GUI.gatewayList.value != "default"){ // Push X-header only if set to non default
    extraSipHeaders.push("X-Gateway:"+GUI.gatewayList.value);
  }
  if(media_type == "video"){
    video = {optional: [{sourceId: GUI.videoSrc.value}]};
  }else{
    video = false;
  };
  var options = {
        media: {
            constraints: {
              audio: {optional: [{sourceId: "GUI.audioSrc.value"}]},
              video: video
            }
        }, extraHeaders: extraSipHeaders
      }        
  var obc = phone.invite(uri, options); // Out bound Call
  connection[obc.request.call_id] = obc; // Pushing connections to array
  
  obc.on('progress', function (e){
    console.debug(e.reason_phrase,e.status_code);
    if(e.status_code == 100){ // show hangup only once not for 180 aswell
      engine.show_hangup(e.call_id);
    }
    engine.status(e.call_id,e.reason_phrase);
    var session = this;
    if (e.status_code === 183 && e.body && session.hasOffer && !session.dialog) {
      if (!e.hasHeader('require') || e.getHeader('require').indexOf('100rel') === -1) {
        session.mediaHandler.setDescription(e.body).then(function onSuccess () {
          session.status = SIP.Session.C.STATUS_EARLY_MEDIA;
          engine.play_tone(e.call_id, session.getRemoteStreams(),media_type);
        }, function onFailure (e) {
          session.logger.warn(e);
          session.acceptAndTerminate(e, 488, 'Not Acceptable Here');
          session.failed(e, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
        });
      }
    }else{
      engine.play_tone(e.call_id,"out-ring",media_type);
    }
  });
  obc.on('accepted', function (e){
    console.debug(e.status_code,e.reason_phrase);
    engine.status(e.call_id,e.reason_phrase);
    engine._200ok(e.call_id,media_type);
  });
  obc.on('rejected', function (e){
    console.debug(e.reason_phrase);
    engine.call_off(e.call_id);
  });
  obc.on('failed', function (e){
    console.debug(e.reason_phrase);
    engine.call_off(e.call_id);
  });
  obc.on('bye', function (e){
    if(e.server_transaction){
      console.debug(e.method,engine.status(e.call_id,"Receiver sent BYE"));
      }else{
        console.debug(e.method,engine.status(e.call_id,"You've sent BYE"));
      }
    engine.call_off(e.call_id);
  });
}

function sipJsConstruction(){
  //Creating user agent constructor
  phone = new SIP.UA(config);
  phoneInstances.push(phone);
  phone.start(); // Start the instance
  phone.on('connected', function () {
    GUI.uaForm.innerHTML = 'Web socket connected';
    console.debug('Wesocket connected');
    //******* on webscoket disconnect and connect back*******
    setTimeout(function (){
      if(phone.isRegistered() === true){
        console.debug('User still connected.......');
      }else{
        phone.register();
        console.debug('connecting back...');
      }
    },3000);
  });
  phone.on('disconnected', function(e){
    GUI.uaForm.innerHTML = 'Web socket disconnected';
  })
  phone.on('registrationFailed', function (cause) {
    GUI.uaForm.innerHTML = 'registration failed :(';
    console.error('registration failed \n'+cause);
  });
  phone.on('registered', function () {
    GUI.uaForm.innerHTML = user+' Registered';
    engine.show_callbutton();
    console.debug('User registered');
  });
  phone.on('unregistered', function () {
    GUI.uaForm.innerHTML = 'Unregistered';
    console.debug('unregistered');
  });
  phone.on('invite', function (session) {
    if(engine.connLimit() == "notexceeded"){ //check connection limit here!
      inBoundCall(session);
    }else{
      session.reject(engine.connReject());
      console.warn('Connection limit exceeded!');
    }
    console.debug('Incoming call');
  });
}
GUI.uaForm.addEventListener('submit', function (e){
  e.preventDefault();
    user = GUI.user.value;
    config['userAgentString'] = 'CCsipjs';  //Push dynamic headers in conf here
    config['authorizationUser'] = user;
    config['uri'] = user+'@'+sipServer[0];
    config['registerExpires'] = GUI.regExpire.value || '300';
    config['traceSip'] = GUI.sipTrace.checked||false;
    sipJsConstruction();
},false);
  // Make audio call
GUI.audioInvite.addEventListener('click', function (e){
  e.preventDefault();
  if(engine.connLimit() == "notexceeded"){ // Check connection limit
    outBoundCall("audio");
  }else{
    alert('Connection limit exceeded!');
  }
  
},false);
  // Make video call
GUI.videoInvite.addEventListener('click', function (e){
  e.preventDefault();
  outBoundCall("video");
},false);