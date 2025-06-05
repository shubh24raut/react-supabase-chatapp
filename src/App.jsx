import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./supabase-client";

function App() {
  const { user, loading, handleLogin, handleLogout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersOnline, setUsersOnline] = useState([]);
  const roomRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setUsersOnline([]);
      return;
    }

    // Create channel and track presence
    const room = supabase.channel("room_one", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    roomRef.current = room;

    room
      .on("broadcast", { event: "message" }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .on("presence", { event: "sync" }, () => {
        const state = room.presenceState();
        setUsersOnline(Object.keys(state));
      });

    room.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await room.track({
          user_id: user.id,
        });
      }
    });

    return () => {
      room.unsubscribe();
    };
  }, [user]);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const msg = {
      id: `${new Date().toISOString()}-${user?.email}`,
      senderId: user.id,
      senderName: user.user_metadata.full_name || user.email,
      avatar:
        user.user_metadata.avatar_url ||
        user.user_metadata.picture ||
        "https://avatar.iran.liara.run/public",
      text: newMessage,
      time: new Date().toISOString(),
    };

    // ✅ 1. Add message locally
    setMessages((prev) => [...prev, msg]);

    // ✅ 2. Broadcast to others
    await roomRef.current.send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });

    setNewMessage("");
  };

  const timeCOnverter = (isoString) => {
    const date = new Date(isoString);
    // Convert to hh:mm (in local time)
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const time = `${hours}:${minutes}`;
    return time;
  };

  return (
    <div className="flex items-center justify-center bg-gray-800 h-screen w-full text-white">
      <div className="flex items-center justify-center h-screen w-full max-w-[1280px] mx-auto p-4 sm:p-0">
        {user ? (
          <div className="flex flex-col border border-gray-400 h-full w-full sm:h-[600px] sm:w-[600px] justify-between rounded-md">
            <div className="p-3 md:p-4 border-b border-white flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-md">
                  Welcome, {user?.user_metadata?.full_name}
                </span>
                <span className="text-sm italic">
                  Signed in as {user?.email}
                </span>
                <span className="text-sm italic">
                  {usersOnline?.length} users online
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="transition-all cursor-pointer duration-300 h-12 border border-white rounded-md px-4 sm:px-8 hover:border-gray-500 hover:text-gray-500"
              >
                Logout
              </button>
            </div>

            <div className="h-full p-2 flex flex-col space-y-3 w-full overflow-auto scroll-smooth">
              {messages.length ? (
                messages.map((msg) => {
                  const isOwnMessage = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-center space-x-2 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwnMessage && (
                        <img
                          src={msg.avatar}
                          alt="user"
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <span
                        className={`p-2 rounded-xl max-w-2/3 flex flex-col ${
                          isOwnMessage ? "bg-gray-400 mr-2" : "bg-gray-500"
                        }`}
                      >
                        <span className="text-sm font-semibold">
                          {msg.senderName}
                        </span>
                        <span>{msg.text}</span>
                        <span className="flex justify-end text-[10px] font-semibold italic text-gray-800">
                          {timeCOnverter(msg.time)}
                        </span>
                      </span>
                      {isOwnMessage && (
                        <img
                          src={msg.avatar}
                          alt="you"
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl italic font-semibold">
                  No messages yet
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmitMessage}
              className="p-3 md:p-4 border-t border-white flex space-y-2 md:space-x-4 flex-col md:flex-row"
            >
              <input
                type="text"
                className="transition-all duration-300 hover:border-gray-500 p-2 h-12 border border-white w-full rounded-md focus:outline-none focus:ring-0"
                placeholder="Type your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                className="transition-all duration-300 cursor-pointer h-12 w-full md:w-1/4 border border-white rounded-md hover:border-gray-500 hover:text-gray-500"
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col border items-center border-gray-400 h-full w-full sm:h-[600px] sm:w-[600px] justify-center rounded-md">
            <button
              onClick={handleLogin}
              className="transition-all duration-300 cursor-pointer h-12 border border-white px-10 hover:border-gray-500 hover:text-gray-500 flex items-center rounded-md"
            >
              {loading
                ? "Signing In..."
                : "Sign up with Google to enter the chat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
