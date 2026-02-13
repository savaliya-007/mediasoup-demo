export const EVENTS = {
  // ----- ROOM -----
  JOIN: "join",
  LEAVE: "leave",
  USER_JOINED: "user:joined",
  ROOM_USERS: "room:users",
  ROOM_COUNT: "room:count",

  // ----- MEDIASOUP -----
  RTP_CAPS: "rtpCapabilities",
  SET_CAPS: "setCaps",
  CREATE_TRANSPORT: "createTransport",
  CONNECT_TRANSPORT: "connectTransport",
  PRODUCE: "produce",
  CONSUME: "consume",
  NEW_PRODUCER: "new-producer",

  // ----- AUDIO / SPEECH -----
  AUDIO_CHUNK: "audio:chunk",
  SPEECH_TEXT: "speech:text",
  SPEECH_TRANSLATED: "speech:translated",

  // ----- SYSTEM -----
  DISCONNECT: "disconnect",
};
