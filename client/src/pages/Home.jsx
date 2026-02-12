import { useState } from "react";

export default function Home({ setView, setUser, setRoom }) {
  const [mode, setMode] = useState(null); // null | create | join
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");

  const canProceedCreate = name.trim().length > 0;
  const canProceedJoin = name.trim().length > 0 && roomInput.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center text-white">
      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-8 w-[350px] space-y-6">
        <h1 className="text-2xl font-bold text-center tracking-wide">
          Live Broadcast
        </h1>

        {/* STEP 1: MODE SELECTION */}
        {!mode && (
          <div className="space-y-3">
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-2 rounded-lg font-semibold"
              onClick={() => setMode("create")}
            >
              Create Broadcast
            </button>

            <button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-2 rounded-lg font-semibold"
              onClick={() => setMode("join")}
            >
              Join Broadcast
            </button>
          </div>
        )}

        {/* STEP 2: FORM */}
        {mode && (
          <>
            {/* NAME */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Your Name</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Enter your name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* ROOM CODE ONLY FOR JOIN */}
            {mode === "join" && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Room Code</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Enter room code"
                  onChange={(e) => setRoomInput(e.target.value)}
                />
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              disabled={mode === "create" ? !canProceedCreate : !canProceedJoin}
              className={`w-full py-2 rounded-lg font-semibold transition disabled:opacity-40 ${
                mode === "create"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                  : "bg-gradient-to-r from-purple-600 to-pink-600"
              }`}
              onClick={() => {
                setUser(name);

                if (mode === "create") {
                  setRoom(""); // speaker generates
                  setView("speaker");
                } else {
                  setRoom(roomInput);
                  setView("listener");
                }
              }}
            >
              {mode === "create" ? "Start Broadcast" : "Join Room"}
            </button>

            {/* BACK BUTTON */}
            <button
              className="w-full text-gray-400 text-sm mt-2 hover:text-white"
              onClick={() => setMode(null)}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
