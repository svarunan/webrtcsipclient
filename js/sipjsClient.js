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
  videoSrc:       document.querySelector('select#videoSrc'),
  videoWindow:    document.getElementById('videoWindow'),
  videoBw    :    document.getElementById('videoBw'),
  canvas:         document.querySelector('canvas'),
  metrics:        document.querySelector('input[name="metrics"]')
}
var sipServer = CONF.serverip,
    user,
    clientTocken,
    phoneInstances = [], // All new SIP.UA goes here
    connection = {}, // All new connections goes here
    connSummary = {conference: 0},
    canvasContext = GUI.canvas.getContext('2d'),
    config = {
      register: false,
      password: CONF.sipPwd,
      // wsServers: 'wss://'+sipServer[0]+':7443'
      // wsServers: 'ws://'+sipServer[1]+':5066'
      wsServers: 'ws://'+sipServer[1]+':5066/ws'
    };

var engine = $().engine; // access engine constructor inside jquery

function inBoundCall(e){
  var media_type = "video";
  if(e.body.search('video') == -1){
    media_type = "audio";
  }
  e.storage = { direction:    "inbound",
                caller_id:    e.remoteIdentity.uri.user, //e.remoteIdentity.displayName+' | '+e.remoteIdentity.uri.user,
                call_state:   "",
                conference:   "",
                timer:        e.request.getHeaders('X-Timeout'),
                uuid:         e.request.getHeader('X-Uuid'),
                isPstn:       e.request.getHeader('X-Pstn'),
                remote_party: e.remoteIdentity.uri.user.replace('+',""),
                media_type:   media_type
                } // Push custom variables to Storage key
  e.call_id = e.from_tag;
  connection[e.call_id] = e; //Push the call obj in connection array
  engine.show_answer_reject(e.call_id,media_type);
  engine.play_tone(e.call_id,"in-ring",media_type);
  engine.status(e.call_id,"ends in: ");
  engine.callTimer(e.call_id,e.storage.timer);
  var ibc = e // In bound Call
  ibc.on('accepted', function (e) {
    if(e.substr(e.search('mid:video')) != " " && e.substr(e.search('mid:video')).search('sendrecv') != -1){
      media_type = "video";
    }else{
      media_type = "audio";
      engine.play_tone(this.call_id,"mute","video");
    }
    this.storage.call_state = "accepted"; //updating state
    $('#'+this.call_id+'_timer')[0].remove(); // Remove call timer
    engine.remove_answer_reject(this.call_id)
    engine.show_hangup_mute(this.call_id,media_type); 
    console.debug(this.storage.caller_id+' : answered');
    engine.status(this.call_id,"");
    engine.conn_summary(); // Send this call for analysis.
    if(GUI.metrics.checked)
      engine.metrics(this.call_id);    
  });
  ibc.on('bye', function (e){
    this.storage.call_state = "bye";
    if(e.server_transaction){ 
      console.debug(e.method,engine.status(this.call_id,'Receiver sent BYE'));
      }else{
        console.debug(e.method,engine.status(this.call_id,"You've sent BYE"));
      }
    engine.call_off(this.call_id);
    console.debug("Call ended");
  });
  ibc.on('failed', function (response,cause){
    this.storage.call_state = "failed";
    if(typeof response == "object"){
      console.debug(engine.status(this.call_id, JSON.stringify(response.headers.Reason, response)));
    }else{
      console.debug(engine.status(this.call_id, response.split('\n')[0]), response);
    }
    engine.call_off(this.call_id);
  });
}

function outBoundCall(media_type,callee){
  var uri = callee,
      extraSipHeaders=["X-tocken:"+clientTocken];
  if (!uri) return;
  if(GUI.gatewayList.value != "default"){ // Push X-header only if set to non default
    extraSipHeaders.push("X-Gateway:"+GUI.gatewayList.value);
  }
  if(media_type == "video"){
    video =  {optional: [{sourceId: GUI.videoSrc.value}] }
    console.debug(video);
  }else{
    video = false;
  };
  var options = {
        media: {
            constraints: {
              audio: {optional: [{sourceId: "GUI.audioSrc.value"}]},
              video: video
            }
        },
        extraHeaders: extraSipHeaders
      }        
  var obc = phone.invite(uri, options); // Out bound Call
  //Pushing custom var to storage.
  obc.storage = { direction:    "outbound",
                  call_state:   "",
                  conference:   "",
                  remote_party: uri,
                  media_type: media_type
  };
  connection[obc.request.call_id] = obc; // Pushing connections to array
  obc.on('progress', function (e){
    console.debug(e.reason_phrase,e.status_code);
    this.storage.call_state = "progress";
    if(e.status_code == 100){ // show hangup only once not for 180 aswell
      engine.show_hangup(e.call_id,callee);
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
    this.storage.call_state = "accepted";
    engine.status(e.call_id,e.reason_phrase);
    engine.store_ExtraHeaders(e.call_id,{uuid:e.getHeader('X-200'),isPstn:e.getHeader('X-Pstn')}); // collect uuid of this leg and save in connection
    engine._200ok(e.call_id,media_type);
    engine.conn_summary(); // Send this call for analysis.
    if(GUI.metrics.checked)
      engine.metrics(e.call_id);
  });
  obc.on('rejected', function (e){
    this.storage.call_state = "rejected";
    console.debug(e.reason_phrase);
    engine.call_off(e.call_id);
  });
  obc.on('failed', function (e){
    this.storage.call_state = "failed";
    console.debug(e);
    engine.call_off(e.call_id);
  });
  obc.on('bye', function (e){
    this.storage.call_state = "bye";
    if(e.server_transaction){
      console.debug(e.method,engine.status(e.call_id,"Receiver sent BYE"));
      }else{
        console.debug(e.method,engine.status(e.call_id,"You've sent BYE"));
      }
    engine.call_off(e.call_id);
  });

  // Making SDP changes
  obc.mediaHandler.on('getDescription',function(sdpWrapper){
    sdpWrapper.sdp = engine.modifySdpCodec(sdpWrapper.sdp); // Check the settings page to see if there is any custum codec pref
    sdpWrapper.sdp = sdpWrapper.sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:'+GUI.videoBw.value+'\r\n');
  });
  obc.mediaHandler.on('setDescription',function(sdpWrapper){
    sdpWrapper.sdp = sdpWrapper.sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:'+GUI.videoBw.value+'\r\n');
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
    engine.getTocken(function(data){
      clientTocken = data; // store the client tocken
    });
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
GUI.uaForm.addEventListener('submit', function (e){ // Register connection.
  e.preventDefault();
  user = GUI.user.value;
  if(location.protocol == "http:" && location.host != "localhost"){
    alert('Either run this app in localhost or in https!');
    return;
  }
  if (!user) return;
  $('#ua-form').css('width',"300px") // Update the Form width to match for status
  config['userAgentString'] = 'CCsipjs';  //Push dynamic headers in conf here
  config['authorizationUser'] = user;
  config['uri'] = user+'@'+sipServer[0];
  config['registerExpires'] = GUI.regExpire.value || '1800';
  config['traceSip'] = GUI.sipTrace.checked||false;
  sipJsConstruction();
},false);
  // Make audio call
GUI.audioInvite.addEventListener('click', function (e){
  e.preventDefault();
  if(engine.connLimit() == "notexceeded"){ // Check connection limit
    outBoundCall("audio",GUI.calledNumber.value);
  }else{
    alert('Connection limit exceeded!');
  }
},false);
  // Make video call
GUI.videoInvite.addEventListener('click', function (e){
  e.preventDefault();
  outBoundCall("video",GUI.calledNumber.value);
},false);
