import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface PermissionModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const PermissionModal = ({ onAccept, onDecline }: PermissionModalProps) => {
  return (
    <Dialog open={true}>
      <DialogContent className="bg-dark-1 text-white">
        <DialogHeader>
          <DialogTitle>Camera Access Required</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>This meeting requires periodic camera access for engagement tracking. Your images will be processed securely.</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onDecline}
            className="text-white hover:bg-dark-2"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="bg-blue-1 hover:bg-blue-1/90"
          >
            Allow Access
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionModal; 