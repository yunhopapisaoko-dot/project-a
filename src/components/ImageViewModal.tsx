import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  alt?: string;
}

export default function ImageViewModal({ isOpen, onClose, imageUrl, alt }: ImageViewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-pink-500 transition-all z-10"
          >
            <X className="w-8 h-8" />
          </motion.button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={alt || 'Imagem'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
