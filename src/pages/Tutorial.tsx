import { useState, useEffect } from "react";
import { PlayCircle, Play, SkipForward, SkipBack, ListVideo, MonitorPlay, ChevronDown } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface TutorialVideo {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface TutorialPlaylist {
  id: string;
  name: string;
  videos: TutorialVideo[];
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
};

const Tutorial = () => {
  const [playlists, setPlaylists] = useState<TutorialPlaylist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<TutorialVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=tutorial_videos`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          // Support new playlists format
          if (Array.isArray(data.playlists) && data.playlists.length > 0) {
            setPlaylists(data.playlists);
            setActivePlaylistId(data.playlists[0].id);
            const firstPlaylist = data.playlists[0];
            if (firstPlaylist.videos.length > 0) {
              setActiveVideo(firstPlaylist.videos.sort((a: TutorialVideo, b: TutorialVideo) => a.order - b.order)[0]);
            }
          }
          // Fallback to old format (flat videos array)
          else if (Array.isArray(data.videos) && data.videos.length > 0) {
            const sorted = data.videos.sort((a: TutorialVideo, b: TutorialVideo) => a.order - b.order);
            const legacyPlaylist: TutorialPlaylist = { id: "default", name: "Tutoriais", videos: sorted };
            setPlaylists([legacyPlaylist]);
            setActivePlaylistId("default");
            setActiveVideo(sorted[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);
  const sortedVideos = activePlaylist?.videos.sort((a, b) => a.order - b.order) || [];
  const activeYouTubeId = activeVideo ? extractYouTubeId(activeVideo.url) : null;
  const activeIdx = activeVideo ? sortedVideos.findIndex(v => v.id === activeVideo.id) : -1;

  const goToVideo = (direction: "prev" | "next") => {
    if (!activeVideo || sortedVideos.length <= 1) return;
    if (direction === "prev" && activeIdx > 0) setActiveVideo(sortedVideos[activeIdx - 1]);
    if (direction === "next" && activeIdx < sortedVideos.length - 1) setActiveVideo(sortedVideos[activeIdx + 1]);
  };

  const handlePlaylistChange = (playlistId: string) => {
    setActivePlaylistId(playlistId);
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.videos.length > 0) {
      setActiveVideo(playlist.videos.sort((a, b) => a.order - b.order)[0]);
    } else {
      setActiveVideo(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Carregando vídeos...</p>
        </div>
        <div className="animate-pulse bg-muted rounded-2xl h-64" />
      </div>
    );
  }

  if (playlists.length === 0 || (playlists.length === 1 && playlists[0].videos.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Aprenda a usar o sistema</p>
        </div>
        <div className="bg-card rounded-2xl p-12 border border-border shadow-card text-center">
          <MonitorPlay className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Nenhum vídeo tutorial disponível no momento.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Os vídeos aparecerão aqui quando forem adicionados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Tutorial de Uso</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Aprenda a usar o sistema com nossos vídeos</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Playlist Selector */}
          {playlists.length > 1 && (
            <div className="relative">
              <select
                value={activePlaylistId || ""}
                onChange={(e) => handlePlaylistChange(e.target.value)}
                className="appearance-none bg-card border border-border rounded-xl pl-3 pr-8 py-2 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name} ({pl.videos.length})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 bg-muted/60 rounded-full px-3 py-1.5">
            <ListVideo className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{sortedVideos.length} {sortedVideos.length === 1 ? "vídeo" : "vídeos"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Player */}
        <div className="lg:col-span-2">
          {activeVideo && activeYouTubeId && (
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="relative w-full bg-black rounded-t-2xl" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${activeYouTubeId}?rel=0&modestbranding=1&autoplay=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display font-bold text-foreground text-base md:text-lg leading-tight">{activeVideo.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5" />
                      Vídeo {activeIdx + 1} de {sortedVideos.length}
                      {activePlaylist && playlists.length > 1 && <span className="text-muted-foreground/60">· {activePlaylist.name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => goToVideo("prev")}
                      disabled={activeIdx === 0}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Vídeo anterior"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => goToVideo("next")}
                      disabled={activeIdx === sortedVideos.length - 1}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Próximo vídeo"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Playlist Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-foreground text-sm">{activePlaylist?.name || "Playlist"}</h3>
              <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {sortedVideos.length}
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {sortedVideos.map((video, idx) => {
                const ytId = extractYouTubeId(video.url);
                const isActive = activeVideo?.id === video.id;
                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-all duration-150 border-b border-border/50 last:border-b-0 ${
                      isActive
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-muted">
                      {ytId && (
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {isActive ? (
                        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[1px]">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      ) : (
                        <div className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isActive ? "text-primary" : "text-foreground"}`}>
                        {video.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Aula {idx + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;