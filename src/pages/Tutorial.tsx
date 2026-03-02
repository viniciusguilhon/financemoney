import { useState, useEffect, useRef } from "react";
import { PlayCircle, Pause, Play, Volume2, VolumeX, Maximize, Settings, SkipForward, SkipBack } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface TutorialVideo {
  id: string;
  title: string;
  url: string;
  order: number;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
};

const Tutorial = () => {
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<TutorialVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=tutorial_videos`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.videos)) {
          const sorted = data.videos.sort((a: TutorialVideo, b: TutorialVideo) => a.order - b.order);
          setVideos(sorted);
          if (sorted.length > 0) setActiveVideo(sorted[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeYouTubeId = activeVideo ? extractYouTubeId(activeVideo.url) : null;

  const goToVideo = (direction: "prev" | "next") => {
    if (!activeVideo || videos.length <= 1) return;
    const idx = videos.findIndex(v => v.id === activeVideo.id);
    if (direction === "prev" && idx > 0) setActiveVideo(videos[idx - 1]);
    if (direction === "next" && idx < videos.length - 1) setActiveVideo(videos[idx + 1]);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Carregando vídeos...</p>
        </div>
        <div className="animate-pulse bg-muted rounded-2xl h-64" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Aprenda a usar o sistema</p>
        </div>
        <div className="bg-card rounded-2xl p-8 border border-border shadow-card text-center">
          <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum vídeo tutorial disponível no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">Aprenda a usar o sistema com nossos vídeos</p>
      </div>

      {/* Main Player */}
      {activeVideo && activeYouTubeId && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${activeYouTubeId}?rel=0&modestbranding=1&autoplay=0`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground text-sm md:text-base">{activeVideo.title}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToVideo("prev")}
                  disabled={videos.findIndex(v => v.id === activeVideo.id) === 0}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  title="Vídeo anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToVideo("next")}
                  disabled={videos.findIndex(v => v.id === activeVideo.id) === videos.length - 1}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  title="Próximo vídeo"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vídeo {videos.findIndex(v => v.id === activeVideo.id) + 1} de {videos.length}
            </p>
          </div>
        </div>
      )}

      {/* Video List */}
      {videos.length > 1 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground text-sm">Todos os Vídeos</h3>
          </div>
          <div className="divide-y divide-border">
            {videos.map((video, idx) => {
              const ytId = extractYouTubeId(video.url);
              const isActive = activeVideo?.id === video.id;
              return (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                    isActive ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-muted">
                    {ytId && (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                      {video.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Vídeo {idx + 1}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
