import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
  Volume1,
  Volume2,
} from "lucide-react";
import { useCall } from "@/contexts/CallContext";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

// Browsers give web pages no way to physically reroute audio to the phone's
// earpiece — that's gated behind native AudioManager (Android) / AVAudioSession
// (iOS) APIs a plain website can't reach, and setSinkId() can't fill the gap
// because phones essentially never expose the earpiece as a separate
// selectable output device. So "speaker off" approximates a private,
// phone-to-ear call by dropping the remote volume instead of rerouting it —
// the one lever HTMLMediaElement actually gives us, and it works everywhere
// (including iOS Safari, where setSinkId doesn't exist at all).
const REMOTE_VOLUME_SPEAKER_ON = 1;
const REMOTE_VOLUME_SPEAKER_OFF = 0.15;

const CallScreen = () => {
  const {
    status,
    callType,
    peer,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    canSwitchCamera,
    hangUp,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const isOnScreen =
    status === "outgoing" ||
    status === "connecting" ||
    status === "active" ||
    status === "ended";
  const isVideo = callType === "video";

  // MediaStream can only be attached imperatively, never as a prop.
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream, isOnScreen]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, isOnScreen]);

  // Re-applied whenever the remote element gets a fresh stream, since
  // assigning srcObject doesn't preserve a previously-set volume.
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = isSpeakerOn
        ? REMOTE_VOLUME_SPEAKER_ON
        : REMOTE_VOLUME_SPEAKER_OFF;
    }
  }, [isSpeakerOn, remoteStream]);

  useEffect(() => {
    if (status !== "active") {
      setDuration(0);
      return;
    }
    const id = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Default back to the loudspeaker for every fresh call.
  useEffect(() => {
    if (status === "outgoing" || status === "connecting") {
      setIsSpeakerOn(true);
    }
  }, [status]);

  const toggleSpeaker = () => setIsSpeakerOn((prev) => !prev);

  const statusLabel = () => {
    switch (status) {
      case "outgoing":
        return "Ringing…";
      case "connecting":
        return "Connecting…";
      case "active":
        return formatDuration(duration);
      case "ended":
        return "Call ended";
      default:
        return "";
    }
  };

  const showRemoteVideo = isVideo && status === "active" && remoteStream;

  return (
    <AnimatePresence>
      {isOnScreen && peer && (
        <motion.div
          className="fixed inset-0 z-[190] flex flex-col bg-[#0d1b2a]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Remote video fills the screen; hidden but mounted for audio-only calls */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              showRemoteVideo ? "" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Avatar treatment for audio calls and pre-connection states */}
          {!showRemoteVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                {status !== "ended" && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-white/15"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <img
                  src={peer.avatar || "/defaultAvatar.png"}
                  alt={peer.name}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-white/20"
                />
              </div>
              <h2 className="text-2xl font-semibold text-white">{peer.name}</h2>
            </div>
          )}

          {/* Header overlay */}
          <div className="relative z-10 flex flex-col items-center pt-10 text-white">
            {showRemoteVideo && (
              <h2 className="text-lg font-semibold drop-shadow-lg">{peer.name}</h2>
            )}
            <p className="mt-1 text-sm text-white/70 tabular-nums drop-shadow-lg">
              {statusLabel()}
            </p>
          </div>

          {/* Local preview */}
          {isVideo && localStream && status !== "ended" && (
            <div className="absolute top-6 right-4 w-28 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/25 shadow-xl bg-black z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isCameraOff ? "opacity-0" : ""
                }`}
              />
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/50" />
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="relative z-10 mt-auto pb-12 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                isMuted
                  ? "bg-white text-[#0d1b2a]"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              type="button"
              onClick={toggleSpeaker}
              aria-label={isSpeakerOn ? "Lower call volume" : "Raise call volume"}
              title={isSpeakerOn ? "Speaker on" : "Quiet (phone-to-ear)"}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                isSpeakerOn
                  ? "bg-white text-[#0d1b2a]"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
            >
              {isSpeakerOn ? (
                <Volume2 className="w-6 h-6" />
              ) : (
                <Volume1 className="w-6 h-6" />
              )}
            </button>

            {isVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                  isCameraOff
                    ? "bg-white text-[#0d1b2a]"
                    : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                {isCameraOff ? (
                  <VideoOff className="w-6 h-6" />
                ) : (
                  <Video className="w-6 h-6" />
                )}
              </button>
            )}

            {isVideo && canSwitchCamera && (
              <button
                type="button"
                onClick={switchCamera}
                disabled={isCameraOff}
                aria-label="Switch camera"
                title="Switch camera"
                className="w-14 h-14 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 bg-white/15 hover:bg-white/25 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            )}

            <button
              type="button"
              onClick={() => hangUp()}
              aria-label="End call"
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallScreen;
