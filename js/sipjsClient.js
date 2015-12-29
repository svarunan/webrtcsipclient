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
    connSummary = {conference: 0},
    config = {
      register: false,
      password: CONF.sipPwd,
      // wsServers: 'wss://'+sipServer[0]+':7443'
      wsServers: 'ws://'+sipServer[1]+':5066'
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
        '<h5 class="outboundcall">Outgoing: '+GUI.calledNumber.value+'</h5>'+
        '<audio id='+id+'_audio class="media_type" style="display: none;" controls> </audio>'+
        '<video id='+id+'_video class="media_type" style="display: none;" controls> </video>'+
        '<br>'+
        '<img class="hicon" id='+id+'_hangup onclick="engine.click_hangup(this.id)">'+
        '<img class="muteicon" id='+id+'_mute onclick="engine.click_mute(this.id)" style="display: none;">'+
        '<img class="holdicon" id='+id+'_hold onclick="engine.click_hold(this.id)" style="display: none;">'+
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
        '<img class="holdicon" id='+id+'_hold onclick="engine.click_hold(this.id)" style="display: none;">'+
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
          '<button onclick=engine.click_transfer("'+id+'") class=blindtx">Blind transfer</button>'+
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
      $('#'+id+'_hold')[0].style.display = "";
      $('#'+id+'_hangup')[0].style.display = "";
      $('#'+id+'_dialpadImage')[0].style.display = "";
      if($('#'+id+'_transfer').length != 0){ // transfer wont come for OB calls
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
        if(connection[id].storage.conference == "enabled"){
          connSummary.conference = connSummary.conference - 1;
        }
        delete connection[id];
        engine.conn_summary();
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
    this.click_hold = function (id){
      var id = this.getId(id),
          uuid = connection[id].request.getHeaders('X-Uuid');
          message = "hold|"+uuid;
          if(connection[id].storage.direction == "inbound"){
            message += "|bleg";
          }
      console.debug('Inside click_hold',id);
      phone.message(user,message);
      if($('#'+id+'_hold')[0].className == "holdicon"){
        $('#'+id+'_hold')[0].className = "unholdicon";
        console.debug("Audio hold");
      }else{
        console.debug("Audio unhold");
        $('#'+id+'_hold')[0].className = "holdicon";
      }
    }
    this.click_transfer = function(id){
      console.debug('Inside click_transfer',id);
      var uuid = connection[id].request.getHeaders('X-Uuid'),
          leg = document.getElementById(id+'_transferdiv').querySelector('select').value
          txNumber = document.getElementById(id+'_transferdiv').querySelector('input').value
          message = "transfer|"+uuid+"|"+leg+"|"+txNumber+"|"+user;
          console.debug(message);
          phone.message(user,message);
    }
    this.click_merge = function(moderator){
      connSummary.conference = connSummary.conference + 1;
      console.debug('Inside click_merge');
      var total_conn = Object.keys(connection).length,
          i = 0, // For total connection count
          con_leg ="", // To capture leg
          total_confMembers = {}, //For total conference members count
          conf_enabledId = "";
          lines = 0; // for total PEER count
      console.debug('Total connection: '+total_conn);
      while(i < total_conn){
        var conn_id = Object.keys(connection)[i];
        //Conference only PEER call with status answered.
        if(connection[conn_id].request.getHeader('X-Pstn') == undefined && connection[conn_id].storage.call_state == "accepted"){
          var uuid = connection[conn_id].request.getHeaders('X-Uuid'),
          // add uuid,from-user to message
          message = "conference|"+uuid+"|"+user;
          if(lines == 0 && connection[conn_id].storage.conference == ""){ // Send the conf moderator and other user to conf server at same time.
            if(connection[conn_id].storage.direction == "inbound"){
              message += "|both";
              con_leg = "aleg";
            }else{
              message += "|both";
              con_leg = "bleg";
            }
            $('#'+conn_id+"_status")[0].innerText = "Conference" // Change the status of this Call DIV
            $('#'+conn_id+"_callPanel").append('<p></p>');
            connection[conn_id].storage.conference = "enabled"; // Update the connection stack
            conf_enabledId = conn_id; // used in show_confMembers
          }else if(lines == 0){ // Used to append a new conn to existing dynamic conference
            conf_enabledId = conn_id;
          }else if(lines > 0 && connection[conn_id].storage.direction == "inbound"){
            message += "|aleg";
            con_leg = "aleg";
          }else if(lines > 0 && connection[conn_id].storage.direction == "outbound"){
            message += "|bleg";
            con_leg = "bleg";
          }
          if(message.split('|')[3]){ // Send only if some leg is present;
            if(moderator == "moderator"){ // check this from merger icon click
              message += "|enableModerator";
            }
            phone.message(user,message);
            console.debug(message);
            //*******For show_confMembers hangup and mute controls.
            total_confMembers[connection[conn_id].storage.remote_party] = con_leg ;
            //***************
          }
          lines++; // TO increment PEER count
        }else{
          console.debug('Ignoring conn id: '+ conn_id);
        }
        i++; // TO increment connection count
      }
      $('.mergeBtn').remove() // Removing Conf icon, Just to clear if conficon is visible
      show_confMembers(total_confMembers,conf_enabledId,function(){
              //nothing for now
      });

      function show_confMembers(confObj,conf_enabledId,cb){
        console.info(confObj,conf_enabledId);
        var i = 0;
        while(i < Object.keys(confObj).length){
          var remoteId = Object.keys(confObj)[i];
          $('#'+conf_enabledId+"_callPanel").append('<div id=confMember_'+remoteId+'>'+
            '<a>'+remoteId+'</a>'+
            '<button onclick=engine.click_confMute("'+remoteId+'") class="confMute">mute</button>'+
            '<button onclick=engine.click_confDeaf("'+remoteId+'") class="confDeaf">deaf</button>'+
            '<button onclick=engine.click_confKick("'+remoteId+'") class="confHangup">kick</button>'+
            '</div>'
            );
          i++;
        }
        cb();
      }
    }
    this.click_confKick = function(id){
      console.debug('inside click_confHangup')
      // confActions | conferenceName | remote user | action to perform
      var message = "confActions|"+user+"|"+ id +"|kick"
      phone.message(user,message);
      $("#confMember_"+id)[0].remove(); // remove the kicked user from UI
      console.debug(message);
    }
    this.click_confMute = function (id){
      console.debug('inside click_confMute');
      var message = "confActions|"+user+"|"+ id +"|tmute",
          muteClass = document.querySelector('#confMember_'+id+' .confMute');
      phone.message(user,message);
      console.debug(message);
      if(muteClass.className == "confMute"){ //Change UI here
        muteClass.className = "confMute confChange";
      }else{
        muteClass.className = "confMute";
      }
    }
    this.click_confDeaf = function (id){
      console.debug('inside click_confDeaf');
      var message = "confActions|"+user+"|"+ id,
          deafClass = document.querySelector('#confMember_'+id+' .confDeaf');
      if(deafClass.className == "confDeaf"){ //Change UI here
        deafClass.className = "confDeaf confChange";
        message += "|deaf";
        phone.message(user,message);
        console.debug(message);        
      }else{
        deafClass.className = "confDeaf";
        message += "|undeaf";
        phone.message(user,message);
        console.debug(message);        
      }
    }
    this.check_merge = function (id){
      $('.mergeBtn').remove();
      if(connSummary.PEER > 1){
        $('.callPanel').after('<div class="mergeBtn">'+
          '<img class="moderator" title="moderator" onclick=engine.click_merge("moderator")>'+
          '<img class="nonmoderator" title="non-moderator" onclick=engine.click_merge("nonmoderator")>'+
          '</div>');
      }
    }
    this.conn_summary = function (){
      connSummary.PEER = 0; // Resetting Connection Summary
      connSummary.PSTN = 0;
      console.debug('Inside conn_summary');
      var total_conn = Object.keys(connection).length,
          i = 0;
      console.debug('Total connection: '+total_conn);
      while(i < total_conn){
        var conn_id = Object.keys(connection)[i];
        if(connection[conn_id].storage.call_state == "accepted"){ //Calculate summary only based on 200 ok
          if(connection[conn_id].request.getHeader('X-Pstn') == undefined){
            connSummary.PEER = connSummary.PEER +1;
          }else if(connection[conn_id].request.getHeader('X-Pstn') == "true"){
            connSummary.PSTN = connSummary.PSTN +1;
          }          
        }
        i++;
      }
      engine.check_merge();
      console.debug(connSummary);
    }
    this.connReject = function (){
      return options = {
                        statusCode: 486,
                        reasonPhrase:"Connection Full"
              };
    }     
    this.getId = function (str){
      return str.split('_')[0];
    }
    this.status = function (id,status){
      $('#'+id+'_status')[0].innerHTML = " "+status;
    }
    this.network_disconnect = function (){
      phoneInstances.pop();
      sipJsConstruction();
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
      if(Object.keys(connection).length == CONF.connLimit){ // Maximum connection limit is 3
        return "exceeded";
      }else{
        return "notexceeded";
      }
    }
    this.set_uuid = function (id,uuid){ //set uuid which comes from X-200 header 
      console.debug('setting uuid of :'+id);
      try{
        connection[id].request.setHeader('X-Uuid',uuid); 
      }catch (err){
        console.error(err.message);
      }
    }
    this.update_uuid = function (){}
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
  e.storage = { direction:    "inbound",
                caller_id:    e.remoteIdentity.uri.user, //e.remoteIdentity.displayName+' | '+e.remoteIdentity.uri.user,
                call_state:   "",
                conference:   "",
                remote_party: e.remoteIdentity.uri.user
                } // Push custom variables to Storage key
  e.call_id = e.from_tag;
  connection[e.call_id] = e; //Push the call obj in connection array
  engine.show_answer_reject(e.call_id,media_type);
  engine.play_tone(e.call_id,"in-ring",media_type);
  engine.status(e.call_id,e.storage.caller_id);
  var ibc = e // In bound Call
  ibc.on('accepted', function (e) {
    if(e.substr(e.search('mid:video')) != " " && e.substr(e.search('mid:video')).search('sendrecv') != -1){
      media_type = "video";
    }else{
      media_type = "audio";
      engine.play_tone(this.call_id,"mute","video");
    }
    this.storage.call_state = "accepted"; //updating state
    engine.remove_answer_reject(this.call_id)
    engine.show_hangup_mute(this.call_id,media_type); 
    console.debug(this.storage.caller_id+' : answered')
    engine.conn_summary(); // Send this call for analysis.
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
  //Pushing custom var to storage.
  obc.storage = { direction:    "outbound",
                  call_state:   "",
                  conference:   "",
                  remote_party: uri 
  };
  connection[obc.request.call_id] = obc; // Pushing connections to array
  obc.on('progress', function (e){
    console.debug(e.reason_phrase,e.status_code);
    this.storage.call_state = "progress";
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
    this.storage.call_state = "accepted";
    engine.status(e.call_id,e.reason_phrase);
    engine.set_uuid(e.call_id,e.getHeader('X-200')); // collect uuid of this leg and save in connection
    engine._200ok(e.call_id,media_type);
    engine.conn_summary(); // Send this call for analysis.
  });
  obc.on('rejected', function (e){
    this.storage.call_state = "rejected";
    console.debug(e.reason_phrase);
    engine.call_off(e.call_id);
  });
  obc.on('failed', function (e){
    this.storage.call_state = "failed";
    console.debug(e.reason_phrase);
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
GUI.uaForm.addEventListener('submit', function (e){ // Register connection.
  e.preventDefault();
    user = GUI.user.value;
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
