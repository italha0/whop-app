import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DownloadModalProps {
  isRendering: boolean;
  status: 'pending' | 'rendering' | 'done' | 'error';
  progress: number;
  error: string | null;
  onDownload: () => void;
  canClose: boolean;
  handleClose: () => void;
}

export const DownloadModal = ({
  isRendering,
  status,
  error,
  onDownload,
  canClose,
  handleClose,
}: DownloadModalProps) => {
  const [visualProgress, setVisualProgress] = useState(0);

  useEffect(() => {
    if (status === 'pending') {
      setVisualProgress(10)
    } else if (status === 'rendering') {
      // Start at 20 and animate to 90
      setVisualProgress(20)
      const interval = setInterval(() => {
        setVisualProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 1
        })
      }, 200) // Adjust speed of animation here

      return () => clearInterval(interval)
    } else if (status === 'done') {
      setVisualProgress(100)
    } else if (status === 'error') {
      setVisualProgress(0)
    }
  }, [status])

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'rendering':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      case 'done':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Starting render...'
      case 'rendering':
        return 'Creating your video...'
      case 'done':
        return 'Video is ready!'
      case 'error':
        return error || 'Something went wrong'
      default:
        return 'Processing...'
    }
  }

  return (
    <Dialog open={isRendering} onOpenChange={canClose ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {status === 'done' ? 'Download Ready' : 'Generating Video'}
          </DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="flex flex-col items-center space-y-6 py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Status Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {getStatusIcon()}
          </motion.div>

          {/* Status Message */}
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-lg font-medium">
              {getStatusMessage()}
            </p>
            
            {status !== 'error' && status !== 'done' && (
              <p className="text-sm text-muted-foreground">
                This usually takes 30-60 seconds
              </p>
            )}
          </motion.div>

          {/* Progress Bar */}
          <AnimatePresence>
            {status !== 'done' && status !== 'error' && (
              <motion.div
                className="w-full space-y-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Progress
                  value={visualProgress}
                  className="w-full h-2 bg-muted"
                />
                <p className="text-center text-xs text-muted-foreground">
                  {Math.round(visualProgress)}% complete
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {status === 'done' && (
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={onDownload}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          </DialogFooter>
        )}
        
        {status === 'error' && (
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}