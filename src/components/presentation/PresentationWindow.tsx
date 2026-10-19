import React, { useEffect, useRef, useState } from 'react';
import { Scene, PresentationSyncMessage } from '../../types/church';
import { resolveMediaUrl, handleMediaImageError, isMediaVideo } from '../../services/tauri';
import { emitChurchMessage, listenChurchMessage } from '../../services/events';
import { AnnouncementRenderer } from '../operator/AnnouncementRenderer';
import { getBibleDynamicFontSizes, getSongDynamicFontSizes } from '../../utils/bibleTypography';

export const PresentationWindow: React.FC = () => {
  const [liveScene, setLiveScene] = useState<Scene | null>(null);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [transition, setTransition] = useState<'cut' | 'fade'>('cut');

  // References to independent native media elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Active mediaLoadId to prevent race conditions and ignore obsolete player events
  const currentMediaLoadIdRef = useRef<number>(1);
  const backgroundAudioTrackRef = useRef<string | null>(null);
  const videoSrcRef = useRef<string | null>(null);

  // Helper para emitir estado continuo al operador con canal explícito y mediaLoadId
  const notifyMediaState = (channel: 'video' | 'audio', el: HTMLMediaElement, ended = false) => {
    emitChurchMessage({
      type: 'MEDIA_STATE_UPDATE',
      channel,
      mediaLoadId: currentMediaLoadIdRef.current,
      currentTime: el.currentTime,
      duration: isNaN(el.duration) ? 0 : el.duration,
      isPlaying: !el.paused && !el.ended,
      volume: el.volume,
      speed: el.playbackRate,
      isMuted: el.muted || el.volume === 0,
      ended,
      activeMediaId: channel === 'video'
        ? (videoSrcRef.current || null)
        : (backgroundAudioTrackRef.current || null),
    });
  };

  // Cross-window event listener
  useEffect(() => {
    // 1. Request initial state from operator window upon mounting
    emitChurchMessage({ type: 'REQUEST_STATE' });

    // 2. Listen to state updates and media actions
    const unsubscribe = listenChurchMessage((msg: PresentationSyncMessage) => {
      if (msg.type === 'LIVE_UPDATE') {
        currentMediaLoadIdRef.current = msg.mediaLoadId || (currentMediaLoadIdRef.current + 1);
        setTransition(msg.transition || 'cut');
        setLiveScene(msg.scene);
        setIsBlackout(msg.isBlackout);

        const newScene = msg.scene;
        const isVideo = newScene?.type === 'video' || (newScene?.type === 'song' && newScene.content.media?.mediaType === 'video');

        // GESTIÓN DEL CANAL DE VIDEO
        if (isVideo && videoRef.current) {
          const filePath = newScene?.content.media?.filePath || newScene?.content.song?.mediaPath;
          if (filePath) {
            const targetUrl = resolveMediaUrl(filePath);
            videoSrcRef.current = filePath;
            const vid = videoRef.current;
            if (vid.src !== targetUrl) {
              vid.pause();
              vid.src = targetUrl;
              vid.currentTime = 0;
              vid.load();
              vid.play().catch((e) => console.log('Video play caught:', e));
            }
          }
          // Si entra un video, el audio del video toma el control: detener audio de fondo
          if (backgroundAudioRef.current) {
            const bgAudio = backgroundAudioRef.current;
            bgAudio.pause();
            bgAudio.src = '';
            backgroundAudioTrackRef.current = null;
          }
        } else {
          // Si el nuevo visual no es video, detener cualquier video en curso
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
            videoSrcRef.current = null;
          }

          // GESTIÓN DEL CANAL DE AUDIO DE FONDO
          if (msg.backgroundAudio) {
            const bgTrack = msg.backgroundAudio;
            if (backgroundAudioRef.current) {
              const bgAudio = backgroundAudioRef.current;
              const targetUrl = resolveMediaUrl(bgTrack.filePath);
              if (backgroundAudioTrackRef.current !== bgTrack.filePath || bgAudio.src !== targetUrl) {
                backgroundAudioTrackRef.current = bgTrack.filePath;
                bgAudio.pause();
                bgAudio.src = targetUrl;
                bgAudio.currentTime = 0;
                bgAudio.load();
                bgAudio.play().catch((e) => console.log('Background audio play caught:', e));
              }
            }
          }
        }
      } else if (msg.type === 'STATE_RESPONSE') {
        setLiveScene(msg.scene);
        setIsBlackout(msg.isBlackout);
        currentMediaLoadIdRef.current = msg.mediaLoadId || 1;
      } else if (msg.type === 'MEDIA_ACTION') {
        // Enrutamiento preciso por canal o destino
        const targetElement = msg.target === 'video'
          ? videoRef.current
          : msg.target === 'audio'
          ? backgroundAudioRef.current
          : (videoRef.current?.src ? videoRef.current : backgroundAudioRef.current);

        if (!targetElement) return;

        if (msg.action === 'play') {
          targetElement.play().catch(console.error);
        } else if (msg.action === 'pause') {
          targetElement.pause();
        } else if (msg.action === 'seek' && msg.time !== undefined) {
          targetElement.currentTime = msg.time;
        } else if (msg.action === 'speed' && msg.speed !== undefined) {
          targetElement.playbackRate = msg.speed;
        } else if (msg.action === 'volume' && msg.volume !== undefined) {
          targetElement.volume = msg.isMuted ? 0 : msg.volume;
        } else if (msg.action === 'stop') {
          targetElement.pause();
          targetElement.currentTime = 0;
        }
      } else if (msg.type === 'DISPOSE_ALL_MEDIA') {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
        }
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current.src = '';
        }
        videoSrcRef.current = null;
        backgroundAudioTrackRef.current = null;
      }
    });

    // Liberar recursos al desmontar o cerrar
    const handleUnload = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.src = '';
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  // Efecto reactivo para garantizar la reproducción de video al montar o cambiar de escena
  useEffect(() => {
    const isVideo = liveScene?.type === 'video' || (liveScene?.type === 'song' && liveScene.content.media?.mediaType === 'video');
    const filePath = liveScene?.content.media?.filePath || liveScene?.content.song?.mediaPath;

    if (isVideo && filePath && videoRef.current) {
      const targetUrl = resolveMediaUrl(filePath);
      const vid = videoRef.current;
      if (vid.src !== targetUrl) {
        vid.src = targetUrl;
        vid.currentTime = 0;
        vid.load();
      }
      vid.play().catch((e) => console.log('Video play caught:', e));
    }
  }, [liveScene]);

  const isHidden = isBlackout || !liveScene || liveScene.type === 'black';

  return (
    <div
      className={`w-screen h-screen bg-black text-white flex items-center justify-center relative overflow-hidden select-none cursor-none [container-type:inline-size] ${
        transition === 'fade' ? 'transition-opacity duration-300' : ''
      }`}
      style={{
        backgroundColor: (!isHidden && liveScene?.style.backgroundColor) ? liveScene.style.backgroundColor : '#000000',
        backgroundImage: (!isHidden && liveScene?.style.backgroundImageUrl && !isMediaVideo(liveScene.style.backgroundImageUrl)) ? `url(${resolveMediaUrl(liveScene.style.backgroundImageUrl)})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Fondo de video animado / motion loop detrás de textos (si el fondo es un archivo de video) */}
      {!isHidden && liveScene?.style.backgroundImageUrl && isMediaVideo(liveScene.style.backgroundImageUrl) && (
        <video
          src={resolveMediaUrl(liveScene.style.backgroundImageUrl)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {!isHidden && liveScene && (() => {
        const { style, content, type } = liveScene;
        return (
          <>
      {/* 1. Versículo Bíblico */}
      {type === 'bible' && content.bible && (() => {
        const text = content.bible.text;
        const fontSizes = getBibleDynamicFontSizes(text, style.fontSize || 46, false);
        return (
          <div className="w-[96%] max-w-[1820px] mx-auto px-4 md:px-10 py-6 flex flex-col items-center justify-center text-center relative z-10">
            <p
              className="font-sans font-black tracking-tight"
              style={{
                fontFamily: style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: fontSizes.fontSizeCqw,
                lineHeight: fontSizes.lineHeight,
                color: style.textColor || '#FFFFFF',
                textShadow: '0 4px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.90)',
                textAlign: style.textAlign || 'center',
              }}
            >
              {text}
            </p>
            <div 
              className="flex items-center justify-center gap-3 mt-6 font-sans font-bold flex-wrap"
              style={{ 
                fontFamily: style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: fontSizes.referenceSizeCqw,
                textShadow: '0 3px 16px rgba(0,0,0,0.98), 0 1px 4px rgba(0,0,0,0.95)',
              }}
            >
              <span className="text-[#FFFFFF]">
                {content.bible.reference}
              </span>
              <span className="text-[#E4E4E7] font-semibold">
                ({content.bible.version})
              </span>
            </div>
          </div>
        );
      })()}

      {/* 2. Canción con Letra — Idéntica contundencia escénica y tipográfica que los versículos bíblicos */}
      {type === 'song' && content.song && (() => {
        const text = content.song.slides[content.song.activeSlideIndex] || content.song.slides[0] || content.song.title;
        const fontSizes = getSongDynamicFontSizes(text, style.fontSize || 46, false);
        return (
          <div className="w-[96%] max-w-[1820px] mx-auto px-4 md:px-10 py-6 flex flex-col items-center justify-center text-center relative z-10">
            <p
              className="font-sans font-black tracking-tight whitespace-pre-line"
              style={{
                fontFamily: style.fontFamily || "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: fontSizes.fontSizeCqw,
                lineHeight: fontSizes.lineHeight,
                color: style.textColor || '#FFFFFF',
                textShadow: '0 4px 24px rgba(0,0,0,0.98), 0 2px 6px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.90)',
                textAlign: style.textAlign || 'center',
              }}
            >
              {text}
            </p>
          </div>
        );
      })()}

      {/* 3. Video en Vivo (Soporte unificado MP4, MOV, WebM, MKV, M4V, etc.) */}
      {(type === 'video' || (type === 'song' && content.media?.mediaType === 'video')) && content.media && (
        <video
          ref={videoRef}
          src={resolveMediaUrl(content.media.filePath)}
          className="w-full h-full object-contain bg-black relative z-10"
          playsInline
          autoPlay
          preload="auto"
          loop={content.media.loop ?? false}
          onTimeUpdate={(e) => notifyMediaState('video', e.currentTarget)}
          onLoadedMetadata={(e) => notifyMediaState('video', e.currentTarget)}
          onPlay={(e) => notifyMediaState('video', e.currentTarget)}
          onPause={(e) => notifyMediaState('video', e.currentTarget)}
          onEnded={(e) => notifyMediaState('video', e.currentTarget, true)}
          onError={(e) => console.warn('[NEXA Video Playback Warning]:', e)}
        />
      )}

      {/* 4. Imagen */}
      {type === 'image' && content.media && (
        <img
          src={resolveMediaUrl(content.media.filePath)}
          alt={content.media.fileName}
          className="w-full h-full object-contain bg-black"
          onError={(e) => {
            handleMediaImageError(e, content.media?.filePath);
          }}
        />
      )}

      {/* 5. Texto Libre */}
      {type === 'text' && content.text && (
        <div className="max-w-6xl px-12 py-10 flex flex-col items-center justify-center text-center">
          <p
            className="font-sans font-medium leading-relaxed tracking-wide whitespace-pre-line"
            style={{
              fontSize: `${(style.fontSize || 46) * 1.05}px`,
              color: style.textColor || '#FFFFFF',
              textShadow: style.textShadow ? '0 4px 16px rgba(0,0,0,0.85)' : 'none',
              textAlign: style.textAlign || 'center',
            }}
          >
            {content.text}
          </p>
        </div>
      )}

      {/* 6. Anuncio Enriquecido o Tradicional */}
      {type === 'announcement' && content.announcement && (
        content.announcement.announcement ? (
          <div className="w-full h-full flex items-center justify-center">
            <AnnouncementRenderer
              announcement={content.announcement.announcement}
              scale={1.0}
            />
          </div>
        ) : (
          <div className="max-w-5xl px-14 py-12 flex flex-col items-center justify-center text-center bg-[#080808] border border-[#27272A] rounded-none">
            {content.announcement.tag && (
              <span className="px-3 py-0.5 rounded-none bg-[#1C1C1C] border border-[#27272A] text-[#D4D4D8] font-bold tracking-widest text-xs uppercase mb-4">
                {content.announcement.tag}
              </span>
            )}
            <h1 className="text-5xl font-black tracking-tight text-white mb-6">
              {content.announcement.title}
            </h1>
            {(content.announcement.date || content.announcement.time) && (
              <div className="text-2xl font-semibold text-[#F59E0B] mb-4">
                {content.announcement.date} {content.announcement.time && `· ${content.announcement.time}`}
              </div>
            )}
            {content.announcement.details && (
              <p className="text-xl text-[#A1A1AA] max-w-3xl leading-relaxed">
                {content.announcement.details}
              </p>
            )}
          </div>
        )
      )}

      {/* 7. Título de Predicación */}
      {type === 'title' && content.title && (
        <div className="max-w-5xl px-12 py-12 flex flex-col items-center justify-center text-center">
          {content.title.series && (
            <span className="text-xs font-mono font-bold tracking-widest text-[#A1A1AA] uppercase mb-3">
              {content.title.series}
            </span>
          )}
          <h1
            className="font-sans font-black tracking-tight mb-4"
            style={{
              fontSize: `${(style.fontSize || 54) * 1.2}px`,
              color: style.textColor || '#FFFFFF',
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}
          >
            {content.title.title}
          </h1>
          {content.title.subtitle && (
            <h2 className="text-3xl font-serif italic text-white/80 mb-6">
              {content.title.subtitle}
            </h2>
          )}
          {content.title.preacher && (
            <div className="px-5 py-1.5 rounded-full bg-white/10 border border-white/15 text-lg font-medium text-white/90">
              {content.title.preacher}
            </div>
          )}
        </div>
      )}
          </>
        );
      })()}

      {/* Audio oculto para reproducción de canal de audio (MP3 de fondo o música) */}
      <audio
        ref={backgroundAudioRef}
        className="hidden"
        onTimeUpdate={(e) => notifyMediaState('audio', e.currentTarget)}
        onLoadedMetadata={(e) => notifyMediaState('audio', e.currentTarget)}
        onPlay={(e) => notifyMediaState('audio', e.currentTarget)}
        onPause={(e) => notifyMediaState('audio', e.currentTarget)}
        onEnded={(e) => notifyMediaState('audio', e.currentTarget, true)}
      />
    </div>
  );
};