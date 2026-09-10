// test-sync.js
// Automated End-to-End Integration Test for YouTube Watch Party backend
// Tests: Room creation, Roles (Host, Moderator, Participant), Permissions, Video Sync, Error Handling.

process.env.PORT = "5005";
const { io } = require("socket.io-client");

// Start backend server on test port 5005
require("./src/server.js");

const SERVER_URL = "http://localhost:5005";
const ROOM_ID = "PARTY1";

let clientHost;
let clientUser2;
let user2Id;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("\n🚀 STARTING WATCH PARTY REAL-TIME SYNC TESTS...\n");
  await wait(1000);

  // TEST 1: Host connects and joins room
  console.log("--- TEST 1: Host creates and joins room ---");
  clientHost = io(SERVER_URL);

  const hostSyncPromise = new Promise((resolve) => {
    clientHost.on("sync_state", (data) => {
      console.log("✓ Host received sync_state:", { role: data.myRole, videoId: data.videoId });
      if (data.myRole !== "Host") throw new Error("Expected role Host for creator");
      resolve(data);
    });
  });

  clientHost.emit("join_room", { roomId: ROOM_ID, username: "Nilesh (Host)" });
  await hostSyncPromise;

  // TEST 2: Participant connects and joins room
  console.log("\n--- TEST 2: Participant joins room ---");
  clientUser2 = io(SERVER_URL);

  const user2SyncPromise = new Promise((resolve) => {
    clientUser2.on("sync_state", (data) => {
      console.log("✓ Second user received sync_state:", { role: data.myRole, videoId: data.videoId });
      if (data.myRole !== "Participant") throw new Error("Expected role Participant for second user");
      user2Id = data.myUserId;
      resolve(data);
    });
  });

  clientUser2.emit("join_room", { roomId: ROOM_ID, username: "Rahul (Participant)" });
  await user2SyncPromise;

  // TEST 3: Host plays video -> Both users should receive 'play'
  console.log("\n--- TEST 3: Host plays video ---");
  let hostReceivedPlay = false;
  let user2ReceivedPlay = false;

  clientHost.once("play", () => { hostReceivedPlay = true; });
  clientUser2.once("play", () => { user2ReceivedPlay = true; });

  clientHost.emit("play");
  await wait(300);

  if (hostReceivedPlay && user2ReceivedPlay) {
    console.log("✓ Both Host and Participant received synchronized 'play' event");
  } else {
    throw new Error("Play event was not received by both clients");
  }

  // TEST 4: Host pauses video -> Both users should receive 'pause'
  console.log("\n--- TEST 4: Host pauses video ---");
  let hostReceivedPause = false;
  let user2ReceivedPause = false;

  clientHost.once("pause", () => { hostReceivedPause = true; });
  clientUser2.once("pause", () => { user2ReceivedPause = true; });

  clientHost.emit("pause");
  await wait(300);

  if (hostReceivedPause && user2ReceivedPause) {
    console.log("✓ Both Host and Participant received synchronized 'pause' event");
  } else {
    throw new Error("Pause event was not received by both clients");
  }

  // TEST 5: Host seeks video -> Both users should receive 'seek' with exact time
  console.log("\n--- TEST 5: Host seeks video to 75 seconds ---");
  let user2SeekTime = null;

  clientUser2.once("seek", (data) => {
    user2SeekTime = data.time;
  });

  clientHost.emit("seek", { time: 75 });
  await wait(300);

  if (user2SeekTime === 75) {
    console.log("✓ Participant successfully synchronized seek time to:", user2SeekTime);
  } else {
    throw new Error("Seek event failed or wrong timestamp");
  }

  // TEST 6: Participant tries to change video -> MUST BE REJECTED BY SERVER
  console.log("\n--- TEST 6: Permission Enforcement - Participant attempts video change ---");
  let errorReceived = false;

  clientUser2.once("error_message", (data) => {
    console.log("✓ Server correctly rejected unauthorized Participant action:", data.message);
    errorReceived = true;
  });

  clientUser2.emit("change_video", { videoId: "dQw4w9WgXcQ" });
  await wait(300);

  if (!errorReceived) {
    throw new Error("Security flaw: Participant action was not rejected by backend!");
  }

  // TEST 7: Host changes video -> Both users receive new video
  console.log("\n--- TEST 7: Host changes video to new ID ---");
  let newVideoReceived = null;

  clientUser2.once("change_video", (data) => {
    newVideoReceived = data.videoId;
  });

  clientHost.emit("change_video", { videoId: "M7lc1UVf-VE" });
  await wait(300);

  if (newVideoReceived === "M7lc1UVf-VE") {
    console.log("✓ Both users synchronized to new video ID:", newVideoReceived);
  } else {
    throw new Error("Failed to synchronize video change");
  }

  // TEST 8: Host promotes Participant to Moderator
  console.log("\n--- TEST 8: Host promotes Participant to Moderator ---");
  let promotedRole = null;

  clientUser2.once("role_assigned", (data) => {
    promotedRole = data.role;
    console.log("✓ Participant role updated event received:", data.role);
  });

  clientHost.emit("assign_role", { userId: user2Id, role: "Moderator" });
  await wait(300);

  if (promotedRole !== "Moderator") {
    throw new Error("Failed to promote user to Moderator");
  }

  // TEST 9: Newly promoted Moderator can now control playback (play video)
  console.log("\n--- TEST 9: Moderator plays video ---");
  let playFromModReceived = false;

  clientHost.once("play", () => {
    playFromModReceived = true;
  });

  clientUser2.emit("play");
  await wait(300);

  if (playFromModReceived) {
    console.log("✓ Moderator successfully issued 'play' event and Host received it");
  } else {
    throw new Error("Moderator play event failed");
  }

  // TEST 10: Host removes Participant
  console.log("\n--- TEST 10: Host removes user from room ---");
  let removedNotificationReceived = false;

  clientUser2.once("removed_by_host", (data) => {
    console.log("✓ Removed user received notification from host:", data.message);
    removedNotificationReceived = true;
  });

  clientHost.emit("remove_participant", { userId: user2Id });
  await wait(300);

  if (!removedNotificationReceived) {
    throw new Error("Removed user was not notified");
  }

  console.log("\n🎉 ALL 10 TEST SUITES PASSED FLAWLESSLY! 🎉\n");
  clientHost.disconnect();
  clientUser2.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});