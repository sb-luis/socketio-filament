let socket = io(); //This will be our exposed io global
let initialised = false;
let me = '';
let recipient = '';
let page = null;
let flyout = false;
let unreadMessages = {};
let unreadTotal = 0;
let userInput = false;
let inputIsValid = false;
let friends = {};

/* SOCKETS */
socket.on('connect', () => {
  //console.log('connection established!');
});

socket.on('logout', () => {
  window.location = '/api/auth/logout';
});

socket.on('friendOnline', (name) => {
  //console.log(`${name} is online.`);
  let f = document.querySelector(`.friend-${name}`);
  if (f) {
    f.parentElement.children[1].classList.remove('offline');
    f.parentElement.children[1].classList.add('online');
  }
});

socket.on('friendOffline', (name) => {
  //console.log(`${name} is offline.`);
  let f = document.querySelector(`.friend-${name}`);
  if (f) {
    f.parentElement.children[1].classList.remove('online');
    f.parentElement.children[1].classList.add('offline');
  }
});

socket.on('addContact', async (name) => {
  //console.log('A contact was added.');
  await getFriends();
  await getUnreadMessages();
  renderUnreadCounter(name);

  if (page == 'contacts') {
    renderFriends();
  }
});

socket.on('deleteContact', async (name) => {
  //console.log('A contact was deleted.');
  await getFriends();
  await getUnreadMessages();
  renderUnreadCounter(name);

  if (page == 'contacts') {
    renderFriends();
  }

  if (recipient == name) {
    //If we´re currently talking with this friend. Stop!
    recipient = '';
    page = 'contacts';
    renderContactsPage();
  }
});

socket.on('addMessage', (content, sender) => {
  if (page == 'chat' && recipient == sender) {
    //If we´re currently talking with this person add the message to the conversation.
    if (validateContent(content)) {
      addMessage('msg', content);
    }
  } else {
    //Otherwise increase our unread message counter with this person.
    messagesUnread(sender);
  }
});

socket.on('message', (msg) => {
  //console.log(msg);
});

socket.on('initialise', (myName) => {
  //console.log('initializing...');
  page = 'contacts';
  me = myName;
  initialise();
});

socket.on('upgrade', () => {
  //console.log('upgraded!');
  window.location.reload();
});

socket.on('downgrade', () => {
  renderDowngrade();
  socket.emit('downgradeSocket'); //Downgrade this socket.
});

function upgradeSocket() {
  socket.emit('upgradeSocket'); //Upgrade this socket.
}

/* MAIN EVENT LISTENER */
document.addEventListener('click', (e) => {
  //e.preventDefault();
  let c = e.target.classList[0];
  let target = e.target;

  if (c == 'userInput') {
    userInput = e.target;
  } else if (document.activeElement.classList[0] == 'userInput') {
    userInput = document.activeElement;
  } else {
    userInput = false;
  }

  //Modifications
  if (
    c == 'online' ||
    c == 'offline' ||
    c == 'fas' ||
    /^friend-/.test(c) ||
    c == 'unreadTotal'
  ) {
    //I´m using the class 0000 as a placeholder for any element I want to select the parent
    c = e.target.parentElement.classList[0];
    target = target.parentElement;
    //console.log('An unwanted children was clicked, parent was selected instead');
  }

  //Destroy any current flyouts or context-windows on each click (dirty approach).
  let friendOptions = document.querySelector('.contact-remove');
  if (friendOptions) friendOptions.remove();

  //Big Switch
  switch (c) {
    case 'friend':
      if (page == 'chat') return;
      page = 'chat';
      let f = target.children[0].innerHTML;
      renderChatPage(f);
      messagesRead(f);
      break;
    case 'page-settings':
      if (page == 'settings') return;
      page = 'settings';
      renderSettingsPage();
      break;
    case 'page-contacts':
      if (page == 'contacts') return;
      page = 'contacts';
      renderContactsPage();
      break;
    case 'logout':
      window.location = '/api/auth/logout';
      break;
    case 'flyout-close':
      if ((page = 'contacts')) closeContentBoxWindow();
      break;
    case 'contact-remove':
      if (page == 'contacts') {
        deleteContact(target.parentElement.parentElement.children[0].innerHTML);
      } else if (page == 'chat') {
        deleteContact(recipient);
      }
      break;
    case 'contact-add':
      addContact(target.parentElement.parentElement.children[0].innerHTML);
      break;
    case 'contact-block':
      blockContact(target.parentElement.parentElement.children[0].innerHTML);
      break;
    case 'upgrade-socket':
      upgradeSocket();
      break;
    case 'open-delete-form':
      renderDeleteForm(0);
      break;
    case 'advance-delete-form':
      renderDeleteForm(1);
      break;
    case 'recipient':
      openFriendOptionsWindow(target);
      break;
  }
});

document.addEventListener('keyup', (e) => {
  if (userInput) {
    //If we´re writting on a
    validateInput(userInput.value);
  }
});

async function initialise() {
  await getUnreadMessages();
  await getFriends();

  //Render Stuff!
  renderNavbar();
  renderContactsPage();
}

/* RENDER FUNCTIONS */
function cleanUpHTML() {
  document.querySelector('main').innerHTML = '';
  document.querySelector('header').innerHTML = '';
  document.querySelector('footer').innerHTML = '';
}

function renderNavbar() {
  if (unreadTotal == 0) {
    unreadCounter = '<i class="fas fa-envelope"></i>';
  } else {
    unreadCounter = `<span class="unreadTotal">${unreadTotal}</span><i class="fas fa-envelope"></i>`;
  }

  document.querySelector('header').innerHTML = `
  <nav class="navbar">
  <p class="nav-title">nav-title</span></p>

  <button class="page-contacts">
    ${unreadCounter}
  </button>

  <button class="page-settings">
    <i class="fas fa-cog"></i>
  </button>
  </nav>`;
}

function renderSettingsPage() {
  if (page != 'settings') return;

  //Set the nav-title
  document.querySelector('.nav-title').innerHTML = 'settings';

  //Main
  let html = '';
  //Friends
  html += `
    <div class="page-content">
      <p class="account-holder">${me} <span class="little-note">logged in</span></p> 
      <button class="logout">logout</button>
      <button class="open-delete-form">delete account</button>
    </div>`;
  document.querySelector('main').innerHTML = html;

  //Footer
  document.querySelector('footer').innerHTML = '';
  page = 'settings';
}

async function renderContactsPage() {
  if (page != 'contacts') return;
  //console.log('rendering contacts!');

  //Set the nav-title
  document.querySelector('.nav-title').innerHTML = 'contacts';

  //Main
  let pageContent = `
    <div class="page-content">
      <div class="search-bar">
      <form method='post' name='user-search' type="submit">
        <input class="userInput" placeholder="search user..." type="text" autocomplete="off" />
        <button class="send-input hidden"><i class="fas fa-search"></i></button>
      </form>
      </div>
    </div>
    `;
  document.querySelector('main').innerHTML = pageContent;

  //Add event listener to  the form.
  let form = document
    .querySelector('.search-bar form')
    .addEventListener('submit', searchContact);

  //Render Friends
  await renderFriends();

  //Footer
  document.querySelector('footer').innerHTML = '';
}

async function renderFriends() {
  if (page != 'contacts') return;

  let div = document.querySelector('.friends');
  if (div) {
    //If we already have a friends div, clear it out.
    div.innerHTML = '';
  } else {
    //Otherwise, create it.
    div = document.createElement('div');
    div.classList.add('friends');
  }

  for (let i = 0; i < friends.length; i++) {
    let f = document.createElement('button');
    f.classList.add('friend');

    let count = 0;
    let countHidden = 'hidden';
    if (unreadMessages[friends[i].name] > 0) {
      count = unreadMessages[friends[i].name];
      countHidden = '';
    }

    f.innerHTML = `<span class="friend-${friends[i].name}">${friends[i].name}</span><span class="offline"></span><span class="unreadCounter ${countHidden}">${count}</span>`;

    if (friends[i].online) {
      f.children[1].classList.add('online');
      f.children[1].classList.remove('offline');
    }

    div.append(f);
  }

  //let bottomFader = document.createElement('div');
  //bottomFader.classList.add('bottom-fader');
  //div.append(bottomFader);

  document.querySelector('.page-content').append(div);
}

async function renderChatPage(contact) {
  if (page != 'chat') return;
  document.querySelector(
    '.nav-title'
  ).innerHTML = `<button class="recipient"><span class="friend-${contact}">${contact}</span><span class="offline"></span></button>`;
  socket.emit('checkIfContactOnline', contact);

  //Add top and bottom faders
  document.querySelector('main').innerHTML = `<div class="top-fader"></div>
  <div class="bottom-fader"></div>`;

  //Add Chat
  let chat = document.createElement('div');
  chat.classList.add('chat');

  //Fetch dialog messages
  let data = {
    username: contact,
  };

  let res = await fetch('/api/dialogs', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  }).catch((err) => console.log(err));

  if (res.status != 200) console.log(await res.text()); //If there is any error in the fetch we log it.
  let dialog = await res.json();

  chat.id = dialog._id;
  chat.innerHTML = '<p class="chat-margin-top"></p>';
  let marginBottom = document.createElement('p');
  marginBottom.classList.add('chat-margin-bottom');
  chat.append(marginBottom);
  let messages = dialog.messages;

  //Append all messages to the chat
  for (let i = 0; i < messages.length; i++) {
    let msg = document.createElement('p');
    msg.tabIndex = 0;
    msg.innerHTML = messages[i].content;

    if (messages[i].sender == contact) {
      msg.classList.add('msg');
    } else {
      msg.classList.add('msg-self');
    }

    marginBottom.before(msg);
  }

  //Add the chat after the top fader.
  let topFader = document.querySelector('.top-fader');
  if (topFader) topFader.after(chat);

  //Scroll conversation to the bottom
  chat.scrollTop = chat.scrollHeight;

  //Add message form in the footer
  document.querySelector('footer').innerHTML = `<form class="msg-form">
    <input class="userInput" placeholder="Write your message..." type="text" autocomplete="off" />
    <button class="send-input hidden"><i class="fas fa-signature"></i></button>
  </form>`;

  //Add event listener to  the form.
  let form = document
    .querySelector('form')
    .addEventListener('submit', sendMessage);

  recipient = contact;
}

function renderDowngrade(params) {
  cleanUpHTML();
  document.querySelector('main').innerHTML = `
  <div class="home">
    <div class="page-text">
    <p>It seems you´re using this app in a different window.</p>
    <p>Do you prefer to use it here instead?</p>
    <p>If not, go ahead and close this window! Who wants that many concurrent processes anyways?</p>
    </div>
    <div class="home-options">
    <button class="upgrade-socket">Use here</button>
    </div>
  </div>
  `;
}

function renderFoundContact(obj) {
  let p = document.querySelector('.content-box');
  let html = '';

  if (!p) {
    p = document.createElement('div');
    p.classList.add('content-box');
    document.querySelector('.search-bar').after(p);
  }

  if (obj.error) {
    html = `
    <p>${obj.error}</p>
    <div class="options">
    <button class="flyout-close">x</button>
    </div>
    `;

    console.log(obj.error);
    p.id = ('error-msg');
    p.classList.remove('user-found');
  } else {
    html = `
    <p>${obj.contact}</p>
    <div class="options">
    <span class="little-note">contact found</span>
    <button class="flyout-close">x</button>
    `;

    //<button class="contact-block"><i class="fas fa-ban"></i></button>

    if (obj.friendship) {
      html +=
        '<button class="contact-remove"><i class="fas fa-user-minus"></i></button>'; //If we are already friends we can delete them.
    } else {
      html +=
        '<button class="contact-add"><i class="fas fa-user-plus"></i></button>'; //If we´re not friends we can add them.
    }

    html += '</div>';
    p.classList.add('user-found');
    p.classList.remove('error-msg');
  }

  p.innerHTML = html;
}

function renderUnreadCounter(contact) {
  if (unreadTotal == 0) {
    document.querySelector('.page-contacts').innerHTML =
      '<i class="fas fa-envelope"></i>';
  } else {
    document.querySelector(
      '.page-contacts'
    ).innerHTML = `<span class="unreadTotal">${unreadTotal}</span><i class="fas fa-envelope"></i>`;
  }

  if (page == 'contacts') {
    let f = document.querySelector(`.friend-${contact}`);
    if (!f) return;
    let u = f.parentElement.querySelector('.unreadCounter');
    if (!u) return;
    if (unreadMessages[contact] == 0) {
      u.classList.add('hidden');
    } else if (unreadMessages[contact] == 1) {
      u.classList.remove('hidden');
      u.innerHTML = unreadMessages[contact];
    } else {
      u.innerHTML = unreadMessages[contact];
    }
  }
}

function renderDeleteForm(i) {
  if (i == 0) {
    document.querySelector('.page-content').innerHTML = `
    <div class='content-box'>
      <p class="error-msg"> are you sure you want to delete your account?</p>
      <p> deleting your account will delete all your conversations & contacts</p>
      <div class="options">
        <button class="page-contacts">cancel</button>
        <button class="advance-delete-form">delete</button>
      </div>
    </div>`;
  } else if (i == 1) {
    document.querySelector('.page-content').innerHTML = `
    <form class='content-box'>
      <p id="password" >
        <label for="">password: </label>
        <input type="password" autocomplete="off">
      </p>
      <div class="options">
        <button type="button" class="page-contacts">cancel</button>
        <button type="submit" class="delete-account">delete</button>
      </div>
    </form>`;

    //Add event listener to  the form.
    let form = document
      .querySelector('form')
      .addEventListener('click', deleteAccount);
  }
}

async function deleteAccount(e) {
  e.preventDefault();
  let action = e.target.innerHTML;
  let pswd = e.target.parentElement.parentElement.children[0];

  if (action == 'delete') {
    socket.emit('deleteAccount', pswd.children[1].value);
    //Post request to the server to delete our account.
    /* let _data = {
      password: pswd.children[1].value,
    };
  
    let res = await fetch('/delete-account', {
      method: 'POST',
      body: JSON.stringify(_data),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    }).catch((err) => console.log(err));

    if(res.status != 200){
      let err = document.querySelector('.error-msg');

      if(err){
        err.innerHTML = await res.text();
      }else{
        let p = document.createElement('p');
        p.classList.add('error-msg');
        p.innerHTML = await res.text();
        pswd.after(p);
      }
    }else{
      //If the request was successful. Refresh page.
      window.location = '/';
    } */
  }
}

//MAIN FUNCTIONS
function openFriendOptionsWindow(friend) {
  let options = document.createElement('button');
  options.innerHTML = '<i class="fas fa-user-minus"></i>';
  options.classList.add('contact-remove');
  friend.after(options);
}

async function closeContentBoxWindow() {
  //Remove contact windows (if its on-screen)
  let contactWindow = document.querySelector('.content-box');
  if (contactWindow) contactWindow.remove();
  page = 'contacts';

  //Render contacts again.
  await getFriends();
  await getUnreadMessages();
  renderContactsPage();
}

async function searchContact(e) {
  e.preventDefault();

  //Remove friendlist while we search (if it still on-screen)...
  let friendlist = document.querySelector('.friends');
  if (friendlist) friendlist.remove();
  page = 'search';

  //Fetch API
  let _data = {
    username: e.target.children[0].value.toLowerCase(),
  };

  let res = await fetch('/api/users/search-contact', {
    method: 'POST',
    body: JSON.stringify(_data),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  }).catch((err) => console.log(err));

  let foundContact = {};
  if (res.status != 200) {
    foundContact.error = await res.text();
  } else {
    foundContact = await res.json();
  }

  renderFoundContact(foundContact);
  e.target.children[0].value = '';
}

async function addContact(name) {
  socket.emit('addContact', name);
  closeContentBoxWindow();
}

async function deleteContact(name) {
  socket.emit('deleteContact', name);
  closeContentBoxWindow();
}

async function blockContact(name) {
  //console.log('This button is temporarily unavailable');
}

function sendMessage(e) {
  e.preventDefault();
  if (recipient == '') return;
  //console.log('recipient: ' + recipient);

  let form = document.querySelector('.msg-form');
  if (!form) return;

  let content = form.children[0].value;

  if (validateContent(content)) {
    addMessage('msg-self', content);
    //Emit message to the server.
    socket.emit('addMessage', content, recipient);
  }

  form.children[0].value = '';
}

//Custom function
function validateInput(content) {
  //Validate the input and forbid the player to send it if its incorrect.
  content = content.replace(/\s/g, ''); //Remove any duplicate spaces.

  if (validateContent(content)) {
    //console.log('Input is valid!');
    if (!inputIsValid) {
      inputIsValid = true;
      userInput.parentElement
        .querySelector('.send-input')
        .classList.remove('hidden');
    }
  } else {
    //console.log('Input is invalid!');
    if (inputIsValid) {
      inputIsValid = false;
      userInput.parentElement
        .querySelector('.send-input')
        .classList.add('hidden');
    }
  }
}

function validateContent(content) {
  //Validate the input and forbid the player to send it if its incorrect.

  if (content.match(/<.*>/) || !content.length) {
    //console.log('Input is invalid!');
    return false;
  } else {
    //console.log('Input is valid!');
    return true;
  }
}

async function getUnreadMessages() {
  //Get Unread Messages
  unreadMessages = {};
  unreadTotal = 0;

  //Fetch Unread Messages
  let res = await fetch('/api/users/unread-messages', {
    method: 'GET',
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  }).catch((err) => console.log(err));

  if (res.status != 200) console.log(await res.text());
  let json = await res.json();

  for (let i = 0; i < json.length; i++) {
    //console.log('Sender: ' + json[i].sender);
    //console.log('Amount: ' + json[i].amount);
    unreadMessages[json[i].sender] = json[i].amount;
    unreadTotal = json[i].amount;
  }
}

async function getFriends() {
  friends = {};

  //Fetch Friends
  let res = await fetch('/api/users/friends', {
    method: 'GET',
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  }).catch((err) => console.log(err));

  if (res.status != 200) console.log(await res.text());
  friends = await res.json();

  //console.log('Got Friendlist');
}

function addMessage(user, content) {
  //Add message to the conversation.
  let chat = document.querySelector('.chat');
  let bottomMargin = document.querySelector('.chat-margin-bottom');
  if (bottomMargin) {
    let p = document.createElement('p');
    p.classList.add(user);
    p.tabIndex = 0;
    p.innerHTML = content;
    bottomMargin.before(p);
  }

  //Scroll conversation to the bottom
  chat.scrollTop = chat.scrollHeight;
}

function messagesRead(contact) {
  let unreadBefore = 0;

  if (unreadMessages[contact]) {
    //If we have any messages unread in this conversation...
    unreadBefore = unreadMessages[contact];

    //Emit the event to update our database in the server.
    socket.emit('messagesRead', contact);
  }

  unreadTotal -= unreadBefore;
  unreadMessages[contact] = 0;
  renderUnreadCounter(contact);
}

function messagesUnread(contact) {
  if (!unreadMessages[contact]) {
    //If we´re not tracking yet the messages with this contact, start doing it!
    unreadMessages[contact] = 0;
  }

  //Increase our unread message counter with this person.
  unreadMessages[contact]++;
  unreadTotal++;
  renderUnreadCounter(contact);

  //Emit the event to update our database in the server.
  socket.emit('messagesUnread', contact);
}
