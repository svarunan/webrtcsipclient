(function($) {
  $.fn.engine = new function (){
    this.show_callbutton = function (e){
      GUI.makeCall_div.style.display = e || "";
    }
    this.show_hangup = function (id,callee){
      console.debug('Inside show_hangup');
      $('.callPanel').append('<div id="'+id+'_callPanel" style="display:;">'+
        '<br>'+
        '<h5 class="IOboundcall">Outgoing: '+callee+'</h5>'+
        '<audio id='+id+'_audio class="media_type" style="display: none;" controls> </audio>'+
        '<video id='+id+'_video '+GUI.videoWindow.value+' class="media_type" style="display: none;" controls> </video>'+
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
        '<h5 class="IOboundcall">Inbound: '+connection[id].storage.caller_id+'</h5>'+
        '<audio id='+id+'_audio class="media_type" style="display: none;" controls> </audio>'+
        '<video id='+id+'_video '+GUI.videoWindow.value+' class="media_type" style="display: none;" controls> </video>'+
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
                  video: {optional: [ {sourceId: GUI.videoSrc.value} ]}
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
          uuid = connection[id].storage.uuid;
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
      var uuid = connection[id].storage.uuid,
          leg = document.getElementById(id+'_transferdiv').querySelector('select').value
          txNumber = document.getElementById(id+'_transferdiv').querySelector('input').value
          message = "transfer|"+uuid+"|"+leg+"|"+txNumber+"|"+user;
          console.debug(message);
          phone.message(user,message);
    }
    this.click_merge = function(moderator){
      function allowConn(id){
        if(connection[id].storage.call_state == "accepted"){ // Filter step 1 by accepted calls
          if(document.getElementsByName('confOptions')[1].checked == true){ // If allow PSTN selected then allow all
            return true;
          }else{
            if(connection[id].storage.isPstn == undefined){ // Filter step 2 by Peer calls
              return true;
            }
          }          
        }
      }
      connSummary.conference = connSummary.conference + 1;
      console.debug('Inside click_merge');
      var total_conn = Object.keys(connection).length,
          i = 0, // For total connection count
          con_leg ="", // To capture leg
          total_confMembers = {}, //For total conference members count
          conf_enabledId = "",
          lines = 0, // for total PEER count
          allowPstn = 
      console.debug('Total connection: '+total_conn);
      while(i < total_conn){
        var conn_id = Object.keys(connection)[i];
        //Conference only PEER call with status answered.
        if(allowConn(conn_id)){
          var uuid = connection[conn_id].storage.uuid,
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
            $('.IOboundcall')[0].remove()// Clear Inbound and outbound status on conference
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
      function showConfBtn (){
        $('.callPanel').after('<div class="mergeBtn">'+
          '<img class="moderator" title="moderator" onclick=engine.click_merge("moderator")>'+
          '<img class="nonmoderator" title="non-moderator" onclick=engine.click_merge("nonmoderator")>'+
          '</div>');
      }      
      $('.mergeBtn').remove();
      var allow_pstn = document.getElementsByName('confOptions')[1].checked;
      if(allow_pstn && (connSummary.PSTN > 1 || connSummary.PEER > 1) ){ // If there is 2 PSTN or 2 Peer
        showConfBtn();
      }else if(allow_pstn && connSummary.PSTN == 1 && connSummary.PEER == 1){ // If there is 1 pstn and 1 peer
        showConfBtn();
      }else if(allow_pstn == false && connSummary.PEER > 1){
        showConfBtn();
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
          if(connection[conn_id].storage.isPstn == undefined){
            connSummary.PEER = connSummary.PEER +1;
          }else if(connection[conn_id].storage.isPstn == "true"){
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
    this.store_ExtraHeaders = function (id,obj){
      console.debug('storing extraHeaders of:'+id);
      try{
        connection[id].storage.uuid = obj.uuid;
        connection[id].storage.isPstn = obj.isPstn;
      }catch (err){
        console.error(err.message);
      }
    }
    this.getTocken = function (cb){
      socket.emit('askTocken',user);
      socket.on('getTocken',function(data){
        cb(data);
      });
    }
    this.callTimer = function (id,seconds){
      console.debug("callTimer",id,seconds);
      if(seconds.length == 0){
        seconds = "60";
      }
      $('#'+id+"_status").after('<a id='+id+'_timer>'+Number(seconds)+'</a>');
      setInterval(function(){
        if($('#'+id+'_timer').length == 0){
          clearInterval(this);
        }else{
          $('#'+id+'_timer')[0].innerHTML = Number($('#'+id+'_timer')[0].innerHTML) -1;
        }
      },1000); // 1 sec
    }
    this.metrics = function (id){
      var audioPrevBytesSent = 0,
          audioPrevBytesReceived = 0,
          videoPrevBytesSent = 0,
          videoPrevBytesReceived = 0;

      $('#'+id+"_callPanel").append(
                              '<div class="'+id+'_tools callTools">'+
                              '<span>localAudio</span><div id='+id+'_audioInput class=audioInput>'+
                              '<div></div></div>'+
                              '<br><span>remoteAudio</span><div id='+id+'_audioOutput class=audioOutput>'+
                              '<div></div></div>'+
                              '<br>audio txKBps - <a id='+id+'_audiotxCodec></a>'+' : <a id='+id+'_audiotx>0</a>'+
                              '<br>audio rxKBps - <a id='+id+'_audiorxCodec></a>'+' : <a id='+id+'_audiorx>0</a>'+                           
                              '<br>video txKBps - <a id='+id+'_videotxCodec></a>'+' : <a id='+id+'_videotx>0</a>'+
                              '<br>video rxKBps - <a id='+id+'_videorxCodec></a>'+' : <a id='+id+'_videorx>0</a>'+
                              '</div>'
                              );
      if(connection[id].storage.media_type == "video"){ // Display screen shot button if media is video
        $('.'+id+'_tools').append('<br><button onclick=engine.screenShot("'+id+'")>Sceen shot</button>');       
      }
      setInterval(function(){
        if($('#'+id+'_callPanel').length == 0){ // Clear this when the call ends
          clearInterval(this);
        }else{
          connection[id].mediaHandler.peerConnection.getStats(function (res) {
            var items = [];
            res.result().forEach(function (result) {
                items.push(result);
            }); 
            items.forEach(function(obj){
              // console.log('..............')
              // console.log(obj.type);
              obj.names().forEach(function(name){
                // console.debug(name+" : ",obj.stat(name));
                if(name == "audioInputLevel" && $('#'+id+'_audioInput').length != 0){ //33000 max audio level
                  $('#'+id+'_audioInput div').css('width',((100/33000)*obj.stat(name)).toFixed()+'%');
                }
                if(name == "audioOutputLevel" && $('#'+id+'_audioOutput').length != 0){
                   $('#'+id+'_audioOutput div').css('width',((100/33000)*obj.stat(name)).toFixed()+'%');           
                } //Measure sent audio bytes
                if(name == "bytesSent" && obj.stat('googCodecName') && obj.stat('audioInputLevel') && $('#'+id+'_audiotx').length != 0){
                  if(audioPrevBytesSent == 0){
                    audioPrevBytesSent = obj.stat('bytesSent');
                  }else{
                    $('#'+id+'_audiotx')[0].innerHTML = Number( ((obj.stat('bytesSent') - audioPrevBytesSent) / 1024).toFixed(1) ) ;
                    $('#'+id+'_audiotxCodec')[0].innerHTML = obj.stat('googCodecName');
                    audioPrevBytesSent = obj.stat('bytesSent');
                  }
                }//Measure sent video bytes
                if(name == "bytesSent" && obj.stat('googCodecName') && !obj.stat('audioInputLevel') && $('#'+id+'_videotx').length != 0){
                  if(videoPrevBytesSent == 0){
                    videoPrevBytesSent = obj.stat('bytesSent');
                  }else{
                    $('#'+id+'_videotx')[0].innerHTML = Number( ((obj.stat('bytesSent') - videoPrevBytesSent)/ 1024).toFixed(1) ) ;
                    $('#'+id+'_videotxCodec')[0].innerHTML = obj.stat('googCodecName');
                    videoPrevBytesSent = obj.stat('bytesSent');
                  }
                }//Measure received audio bytes
                if(name == "bytesReceived" && obj.stat('googCodecName') && obj.stat('audioOutputLevel') && $('#'+id+'_audiorx').length != 0){
                  if(audioPrevBytesReceived == 0){
                    audioPrevBytesReceived = obj.stat('bytesReceived');
                  }else{
                    $('#'+id+'_audiorx')[0].innerHTML = Number( ((obj.stat('bytesReceived') - audioPrevBytesReceived) / 1024).toFixed(1) ) ;
                    $('#'+id+'_audiorxCodec')[0].innerHTML = obj.stat('googCodecName');
                    audioPrevBytesReceived = obj.stat('bytesReceived');
                  }
                }//Measure received video bytes
                if(name == "bytesReceived" && obj.stat('googCodecName') && !obj.stat('audioOutputLevel') && $('#'+id+'_videorx').length != 0){
                  if(videoPrevBytesReceived == 0){
                    videoPrevBytesReceived = obj.stat('bytesReceived');
                  }else{
                    $('#'+id+'_videorx')[0].innerHTML = Number( ((obj.stat('bytesReceived') - videoPrevBytesReceived)/ 1024).toFixed(1) ) ;
                    $('#'+id+'_videorxCodec')[0].innerHTML = obj.stat('googCodecName');
                    videoPrevBytesReceived = obj.stat('bytesReceived');
                  }
                }                
              });
            });
          });
        }
      },1000);
    }
    this.modifySdpCodec = function (sdp){
      var codecHtml = document.getElementsByName('codec'),
          i = 0,
          codecObj = {};
          codecPayload = { OPUS:111,G722:9,PCMU:0,PCMA:8 };
      while(i < codecHtml.length){
        codecObj[codecHtml[i].value] = codecHtml[i].checked
        i++;
      }
      console.debug('Codec pref: ',codecObj);
      if(codecObj.AUTO == false){
        var codecLine = " ";
        sdp =  sdp.replace(/\na=rtpmap:(.*) ISAC(.*)/g,""); // Remove ISAC codec from codec
        if(codecObj.OPUS == false){
          sdp = sdp.replace(/\na=rtpmap:111 opus(.*\n.*)/g,"");
        }else{
          codecLine += "111 ";
        }
        if(codecObj.G722 == false){
          sdp = sdp.replace(/\na=rtpmap:(.*) G722(.*)/g,"");
        }else{
          codecLine += "9 ";
        }
        if(codecObj.PCMU == false){
          sdp = sdp.replace(/\na=rtpmap:(.*) PCMU(.*)/g,"");
        }else{
          codecLine += "0 ";
        }
        if(codecObj.PCMA == false){
          sdp = sdp.replace(/\na=rtpmap:(.*) PCMA(.*)/g,"");
        }else{
          codecLine += "8 ";
        }
        if(sdp.search(/\na=rtpmap:(.*) CN(.*)/g) > 0){ // IF confort noise code is available
          codecLine += "106 105 13 ";
        }
        codecLine += "126"; // telephone payload default
        sdp = sdp.replace(/ 111 (.*)/g,codecLine);
        console.debug('ModifiedSDP\n',codecLine,"\n",sdp);
        return sdp;
      }else{
        console.debug('Codec mode AUTO :',codecObj.AUTO);
        return sdp;
      }
    }
    this.screenShot = function(id){
      var video = document.getElementById(id+'_video');
      GUI.canvas.width = video.videoWidth; // Increase Canvas width and height as per video size
      GUI.canvas.height = video.videoHeight;
      canvasContext.fillRect(0,0,video.videoWidth,video.videoHeight);
      canvasContext.drawImage(video,0,0,video.videoWidth,video.videoHeight);
      $('#canvasClear').remove();// remove existing button;
      $('canvas').after('<button id="canvasClear" onclick="javascript:canvasContext.clearRect(0,0,'+
                        video.videoWidth+','+video.videoHeight+')">Clear</button>');
    }
    this.getMediaDevices = function (){
      if (typeof navigator.mediaDevices === 'undefined') {
        alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
      } else {
        navigator.mediaDevices.enumerateDevices().then(function(devices){
          // console.info(devices);
          for (var i = 0; i < devices.length; i++) {
            var option = document.createElement('option');
            option.value = devices[i].id;
            option.text = devices[i].label || devices[i].kind+"-"+i;
            if (devices[i].kind.match("audio")) {
              audioSrc.appendChild(option);
            } else if (devices[i].kind.match("video")) {
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