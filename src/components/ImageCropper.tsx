import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Move } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
  circular?: boolean;
}

const ImageCropper = ({ open, onOpenChange, imageSrc, onCropComplete, aspectRatio = 1, circular = false }: ImageCropperProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cropSize = 220;
  const cropHeight = cropSize / aspectRatio;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [open, imageSrc]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setImgSize({ w: nw, h: nh });

    // Fit image to fill the crop area
    const fitScale = Math.max(cropSize / nw, cropHeight / nh) * 1.1;
    setScale(fitScale);

    // Center image
    const displayW = nw * fitScale;
    const displayH = nh * fitScale;
    setPosition({
      x: (cw - displayW) / 2,
      y: (ch - displayH) / 2,
    });
    setImgLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

  const handleCrop = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const outputWidth = 400;
    const outputHeight = outputWidth / aspectRatio;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const displayW = nw * scale;
    const displayH = nh * scale;

    // Crop window center is at container center
    const cropLeft = (cw / 2 - cropSize / 2 - position.x) / displayW * nw;
    const cropTop = (ch / 2 - cropHeight / 2 - position.y) / displayH * nh;
    const cropW = (cropSize / displayW) * nw;
    const cropH = (cropHeight / displayH) * nh;

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
            className="relative w-full h-64 bg-black/90 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
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
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: imgSize.w * scale,
                height: imgSize.h * scale,
                maxWidth: "none",
              }}
              draggable={false}
              onLoad={handleImgLoad}
            />

            {/* Crop overlay */}
            {circular ? (
              <div className="absolute border-2 border-white/80 rounded-full pointer-events-none"
                style={{
                  left: "50%", top: "50%",
                  width: cropSize, height: cropSize,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                }}
              />
            ) : (
              <div className="absolute bg-transparent border-2 border-white/80 rounded-lg pointer-events-none"
                style={{
                  left: "50%", top: "50%",
                  width: cropSize, height: cropHeight,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                }}
              />
            )}
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3 px-2">
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[scale]}
              onValueChange={([v]) => {
                // Adjust position to zoom towards center
                const container = containerRef.current;
                if (container) {
                  const cx = container.clientWidth / 2;
                  const cy = container.clientHeight / 2;
                  const ratio = v / scale;
                  setPosition(prev => ({
                    x: cx - (cx - prev.x) * ratio,
                    y: cy - (cy - prev.y) * ratio,
                  }));
                }
                setScale(v);
              }}
              min={0.1}
              max={5}
              step={0.02}
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
