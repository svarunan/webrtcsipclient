Author: Sasivarunan
Client: SIPphone
Lib: jQuery,socket.IO,sipjs
confFile: conf.js


Description:
sipjs http://sipjs.com/, for making a websocket connection with VOIP server, You can use ws or wss either.
It collectes SDP info from your HTML5 webRTC mediaconstraints.

sipjsClient.js
To handle UI and media.

SocketIO
To make a separate websocket connection to your nodejs server

Top variables:
	connection:
	To push all inbound and outbound connection details to connection stack and retrive on demand

	connSummary:
	Get count of PSTN, PEER, Conference connections on every call actions.

Settings:
You can change media related options here

Total connections allowed: 3 
You can change it in engine connLimit

Conference:
Only PEER calls are allowed in conference. If you want to add PSTN as well
Check engine click_merge

Getting UUID for Legs in client side:
 A calls B
.........
 B will get legA uuid with x-uuid header on Invite
 A will get back legA uuid with x-200 header on 200 ok
 You can't get legB uuid on client side, Since legB uuid is not availabe in ESL connection

You can pass legA Uuid to server to get legB uuid using message() available in SIP.UA
