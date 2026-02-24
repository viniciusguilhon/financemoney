import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Move } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number; // width/height
  circular?: boolean;
}

const ImageCropper = ({ open, onOpenChange, imageSrc, onCropComplete, aspectRatio = 1, circular = false }: ImageCropperProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cropSize = 240;
  const cropHeight = cropSize / aspectRatio;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputWidth = 400;
    const outputHeight = outputWidth / aspectRatio;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate the visible area of the image relative to the crop window
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const imgDisplayWidth = img.naturalWidth * scale;
    const imgDisplayHeight = img.naturalHeight * scale;

    const cropLeft = (containerRect.width / 2 - cropSize / 2 - position.x) / imgDisplayWidth * img.naturalWidth;
    const cropTop = (containerRect.height / 2 - cropHeight / 2 - position.y) / imgDisplayHeight * img.naturalHeight;
    const cropW = (cropSize / imgDisplayWidth) * img.naturalWidth;
    const cropH = (cropHeight / imgDisplayHeight) * img.naturalHeight;

    if (circular) {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(img, cropLeft, cropTop, cropW, cropH, 0, 0, outputWidth, outputHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        onCropComplete(file);
        onOpenChange(false);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Move className="w-4 h-4" /> Ajustar Imagem
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative w-full h-64 bg-black/90 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              className="absolute pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "0 0",
                left: "50%",
                top: "50%",
                marginLeft: "-50%",
                marginTop: "-50%",
              }}
              draggable={false}
            />

            {/* Overlay with crop hole */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50" style={{
                clipPath: circular
                  ? `path("M 0 0 L ${999} 0 L ${999} ${999} L 0 ${999} Z M ${999/2} ${999/2 - cropSize/2} A ${cropSize/2} ${cropSize/2} 0 1 0 ${999/2} ${999/2 + cropSize/2} A ${cropSize/2} ${cropSize/2} 0 1 0 ${999/2} ${999/2 - cropSize/2} Z")`
                  : undefined
              }}>
                {!circular && (
                  <div className="absolute bg-transparent border-2 border-white/80 rounded-lg"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: cropSize,
                      height: cropHeight,
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                    }}
                  />
                )}
              </div>
              {circular && (
                <div className="absolute border-2 border-white/80 rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: cropSize,
                    height: cropSize,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                  }}
                />
              )}
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3 px-2">
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[scale]}
              onValueChange={([v]) => setScale(v)}
              min={0.5}
              max={3}
              step={0.05}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(scale * 100)}%</span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleCrop} className="gradient-primary text-primary-foreground">Confirmar</Button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
