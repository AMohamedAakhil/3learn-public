import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";

import { Button } from "./ui/button";

import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

const EndCallButton = () => {
  const { toast } = useToast();
  const router = useRouter();

  const call = useCall();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  return (
    <Button
      onClick={async () => {
        const classes = ["Science", "Maths"];
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        
        try {
          await fetch(`https://w5zybg82zh6zka-8010.proxy.runpod.net/leaderboard/${randomClass}/increment`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to increment leaderboard:', error);
        }

        await call.endCall();
        router.push("/");
        toast({
          title: "You have ended the meeting.",
        });
      }}
      className="bg-red-500 hover:bg-red-400 transition-all"
    >
      End Call for everyone
    </Button>
  );
};

export default EndCallButton;
