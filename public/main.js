
//    $('#regArea').fadeIn(1500);

$(function(){
    let socket = io.connect();

var msgText = $('#msg');
var form = $('#textForm');
var chatBox = $('.chat-container');
var display = $('.message');
let times = new Date().toLocaleTimeString()
let formArea = $('#formArea');
let userForm = $('#userform');
let name = $('#name');
let users = $('#users');
let err = $('#err');
let reg = $('#regArea');
let regform = $('#regform');
let pass = $('#pass');
let regName = $('#Regname');
let logPass = $('#logPass');
let loginUser = $('#loginUser');

        loginUser.click(function(){
            reg.hide();
            chatBox.hide();
            formArea.fadeIn(2500, function(){
                formArea.show()
            });
        })



regform.submit(function(e){
    e.preventDefault();

    fetch('/reg', {
        method: 'POST',
        headers: {
            'Accept':'application/json, text/plain, */*',
                    'Content-type': 'application/json'
        },
        body: JSON.stringify({user: regName.val(), password:pass.val()})
    })
    .then((res) => res.json())
    .then(async(data) => console.log(data))
    regName.val('')
    pass.val('')
})

form.submit(function(e){
e.preventDefault();
        myMsg(msgText.val());
socket.emit('send message', msgText.val(), function(data){
    display.append(`<strong class='err'>${data}</strong>`)
})
msgText.val('')
})

        socket.on('reg user', (data)=>{
            console.log(data.message)
            display.append(`<strong >${data.message}</strong>`)
            reg.hide();
            chatBox.hide();
            formArea.show();
        })

    socket.on('load message', (data)=>{
        for(i =0; i<data.length; i++){

                // myMsg(data[i].msg);
                // otherMsg(data[i]);

        }
    })
socket.on('new message', (data)=>{
            otherMsg(data);
})
socket.on('whisper', (data)=>{
        whisper(data)
})
socket.on('reg user', ()=>{
    reg.hide();
    chatBox.hide();
    formArea.show();
})

        userForm.submit(function(e){
            e.preventDefault()

           fetch('/newUser', {
               method:  'POST',
               headers: {
                   'Accept': 'application/json, text/plain, */*',
                   'Content-type': 'application/json'
               },
               body: JSON.stringify({user: name.val(), password: logPass.val()})
           })
           .then((res)=> res.json())
           .then(async(data)=> {
            console.log(data)
           })

           name.val('');
           logPass.val('');
        });

        socket.on('new user', (data)=>{
            // console.log(data.message);
            // console.log(data.user);
            // socket.emit('log user', data.user);
            // formArea.hide();
            // chatBox.show();
            socket.emit('log user', data.user, function(data){
                if(data){
                    formArea.hide();
                    chatBox.show();
                }else{
                    err.html(`<div class='alert alert-danger'>Sorry!! This User is already here pick a new Nickname</div>`)
                }
            });

            });



        socket.on('get users', (data)=>{
            let html = ''
                for(i = 0; i<data.length; i++){
                    html += `
                    <ul class='list-group'>
                        <li class='list-group-item'><strong>${data[i].toUpperCase()}</strong></li>
                        </ul>

                    `
                }
                    users.html(html)
        })

        function myMsg(data){
            let times = new Date().toLocaleTimeString();
            display.append(`
    <div class="message-row you-message">
        <div class="message-title">
                                 &#128512; <span>Me</span>
                                    </div>
                                    <div class="message-text">
                                        ${data}
                                    </div>
                                    <div class="message-time">
                                        ${times}
                                    </div>
        </div>
`)
        }
        function otherMsg(data){
            let times = new Date().toLocaleTimeString();
                   display.append(`
    <div class="message-row other-message">
        <div class="message-title">
                       &#128515; <span>${data.user }</span>
                                    </div>
                                    <div class="message-text">
                                        ${data.msg }
                                    </div>
                                    <div class="message-time">
                                        ${times }
                                    </div>
        </div>
`)
        }

        function whisper(data){
            let times = new Date().toLocaleTimeString();
            display.append(`
    <div class="message-row other-message">
        <div class="message-title">
            &#x1F510; <strong>${data.user}</strong>
                                    </div>
                                    <div class="message-text">
                                        ${data.msg}
                                    </div>
                                    <div class="message-time">
                                        ${times}
                                    </div>
        </div>
`)
        }

        socket.on('wrong username', (data)=>{
            err.html(`<div class='alert alert-danger'>${data.message}</div>`);
            err.fadeOut(4000);
        })
})



