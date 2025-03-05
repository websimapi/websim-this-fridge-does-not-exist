// WebSocket connection and database management
const room = new WebsimSocket();

// Function to get current timestamp in readable format
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Collection for fridge creations
const fridgeCollection = {
  getAll: () => room.collection('fridge').getList(),
  create: async (data) => {
    return await room.collection('fridge').create(data);
  },
  subscribe: (callback) => room.collection('fridge').subscribe(callback)
};

// Notify others when new fridge is created
function notifyNewFridge(fridgeData) {
  room.send({
    type: "newFridge",
    echo: true,
    fridgeId: fridgeData.id,
    username: fridgeData.username
  });
}

// Listen for events from other users
room.onmessage = (event) => {
  const data = event.data;
  
  switch (data.type) {
    case "connected":
      console.log(`User connected: ${data.username}`);
      break;
    case "disconnected":
      console.log(`User disconnected: ${data.username}`);
      break;
    case "newFridge":
      console.log(`New fridge created by ${data.username}`);
      // Play a notification sound or show a toast message could be added here
      break;
    default:
      console.log("Received unknown event:", data);
  }
};

