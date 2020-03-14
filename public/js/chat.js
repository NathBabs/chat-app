const socket = io();

//Elements
const $messageForm = document.querySelector("#messageTxt");
const $messageInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationBtn = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-url").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true });

// server (emit) -> client (recieve) acknowledgement -> sPerver
//client (emit) -> server (recieve) -> client

const autoScroll = () => {
  //get new message element
  const $newMessage = $messages.lastElementChild;

  //Get height of new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //Height of mesages container
  const containerHeight = $messages.scrollHeight;

  //How far have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight;
  }

};

socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm a')
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", message => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('hh:mm a')
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector("#sidebar").innerHTML = html;

});

$messageForm.addEventListener("submit", event => {
  event.preventDefault();
  //disable form
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = event.target.elements.text.value;

  socket.emit("sendMessage", message, error => {
    $messageFormButton.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();
    // enable form
    if (error) {
      return console.log(error);
    }

    //console.log("Message delivered");
  });
});

$locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  //disable send location button
  $locationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    const posCoord = {
      lat: position.coords.latitude,
      long: position.coords.longitude
    };
    socket.emit("sendLocation", posCoord, () => {
      $locationBtn.removeAttribute("disabled");
      $messageInput.focus();
    });
  });
});

socket.emit('join', { username, room}, (error) => {
  if(error){
    alert(error);
    location.href = '/';
  }
});
