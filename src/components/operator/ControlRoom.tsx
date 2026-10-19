import React, { useState, useEffect, useRef } from 'react';
import {
  IconCues,
  IconBible,
  IconMedia,
  IconAnnouncements,
  IconDisplays,
  IconAudio,
  IconSettings,
  IconMusic,
} from '../common/NexaIcons';
import { TitleBar } from '../layout/TitleBar';
import { SceneManager } from './SceneManager';
import { SongLibrary } from './SongLibrary';
import { SongEditorModal } from './SongEditorModal';
import { SongImporterModal } from './SongImporterModal';
import { BibleBrowser } from './BibleBrowser';
import { MediaLibrary } from './MediaLibrary';
import { AnnouncementManager } from './AnnouncementManager';
import { AnnouncementEditor } from './AnnouncementEditor';
import { PreviewMonitor } from './PreviewMonitor';
import { LiveMonitor } from './LiveMonitor';
import { CueInfoPanel } from './CueInfoPanel';
import { DisplaysPanel } from './DisplaysPanel';
import { AudioControlPanel } from './AudioControlPanel';
import { SettingsPanel } from './SettingsPanel';
import { TransportBar } from './TransportBar';
import { DisplaySelector } from './DisplaySelector';
import { AboutModal } from './AboutModal';
import { EventEditorModal } from './EventEditorModal';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { BroadcastModal } from './BroadcastModal';
import { usePresentation } from '../../stores/presentationStore';
import { resolveMediaUrl } from '../../services/tauri';
import { emitChurchMessage } from '../../services/events';

export type RailTab = 'cues' | 'canciones' | 'biblia' | 'media' | 'anuncios' | 'pantallas' | 'audio' | 'ajustes';

export const ControlRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RailTab>('cues');
  const [showDisplaysModal, setShowDisplaysModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showEventEditorModal, setShowEventEditorModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const presentation = usePresentation();
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Si la ventana de proyector externa está abierta, ella tiene el control exclusivo del audio
    if (presentation.presentationWindowOpen) {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.src = '';
      }
      return;
    }

    const audioEl = localAudioRef.current;
    if (!audioEl) return;

    if (
      presentation.backgroundAudio &&
      presentation.mediaPlayback.isPlaying &&
      presentation.currentAudioSource === 'background'
    ) {
      const targetUrl = resolveMediaUrl(presentation.backgroundAudio.filePath);
      if (audioEl.src !== targetUrl) {
        audioEl.src = targetUrl;
        audioEl.currentTime = presentation.mediaPlayback.currentTime || 0;
        audioEl.load();
      }
      audioEl.volume = presentation.mediaPlayback.isMuted ? 0 : presentation.mediaPlayback.volume;
      audioEl.playbackRate = presentation.mediaPlayback.speed || 1;
      audioEl.play().catch((err) => console.log('Local operator audio play caught:', err));
    } else {
      if (!audioEl.paused) {
        audioEl.pause();
      }
    }
  }, [
    presentation.presentationWindowOpen,
    presentation.backgroundAudio,
    presentation.mediaPlayback.isPlaying,
    presentation.mediaPlayback.volume,
    presentation.mediaPlayback.isMuted,
    presentation.mediaPlayback.speed,
    presentation.currentAudioSource,
  ]);

  const railNavItems: { id: RailTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'cues', label: 'CUES', icon: IconCues },
    { id: 'canciones', label: 'CANCIONES', icon: IconMusic },
    { id: 'biblia', label: 'BIBLIA', icon: IconBible },
    { id: 'media', label: 'MULTIMEDIA', icon: IconMedia },
    { id: 'anuncios', label: 'ANUNCIOS', icon: IconAnnouncements },
    { id: 'pantallas', label: 'PANTALLAS', icon: IconDisplays },
    { id: 'audio', label: 'AUDIO', icon: IconAudio },
    { id: 'ajustes', label: 'AJUSTES', icon: IconSettings },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#F4F4F5] overflow-hidden select-none font-sans">
      {/* Title Bar with SHALIM TECHNOLOGIES Identity */}
      <TitleBar
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenDisplays={() => setShowDisplaysModal(true)}
        onOpenEventEditor={() => setShowEventEditorModal(true)}
        onOpenBroadcast={() => setShowBroadcastModal(true)}
      />

      {/* Main Workspace: Navigation Rail + SubPanel + Center Dual Stage */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-[#000000]">
        {/* Navigation Rail (Pro Broadcast Console 60px) */}
        <aside className="w-[60px] bg-[#0A0A0C] border-r border-[#1C1C1E] flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-30">
          <div className="flex flex-col items-center gap-1.5 w-full">
            {railNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-[52px] py-1.5 px-0.5 flex flex-col items-center justify-center gap-1 transition-all relative group ${
                    isActive
                      ? 'bg-[#18181C] text-white border-l-2 border-red-600 shadow-sm'
                      : 'text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#121214]'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-[#71717A] group-hover:text-[#D4D4D8]'}`} />
                  <span className={`text-[8.5px] font-mono tracking-tight font-medium ${isActive ? 'text-white font-bold' : 'text-[#71717A]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Side Panel (340px) */}
        <div className="w-80 md:w-84 bg-[#0A0A0C] border-r border-[#1C1C1E] flex flex-col shrink-0 min-h-0 overflow-hidden">
          {activeTab === 'cues' && (
            <SceneManager onOpenEventEditor={() => setShowEventEditorModal(true)} />
          )}
          {activeTab === 'canciones' && <SongLibrary />}
          {activeTab === 'biblia' && <BibleBrowser />}
          {activeTab === 'media' && <MediaLibrary />}
          {activeTab === 'anuncios' && <AnnouncementManager />}
          {activeTab === 'pantallas' && (
            <DisplaysPanel onOpenDisplaysModal={() => setShowDisplaysModal(true)} />
          )}
          {activeTab === 'audio' && <AudioControlPanel />}
          {activeTab === 'ajustes' && (
            <SettingsPanel
              onOpenAbout={() => setShowAboutModal(true)}
              onOpenDisplays={() => setShowDisplaysModal(true)}
              onOpenEventEditor={() => setShowEventEditorModal(true)}
            />
          )}
        </div>

        {/* Center Stage Workspace (PREVIEW + CUE INFO | PROGRAM LIVE) */}
        <main className="flex-1 flex min-w-0 bg-[#000000] overflow-hidden p-2 gap-2">
          {/* Left Column: PREVIEW MONITOR + CUE INFO PANEL */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-2">
            <div className="flex-1 min-h-0 flex flex-col">
              <PreviewMonitor />
            </div>
            <CueInfoPanel onOpenEventEditor={() => setShowEventEditorModal(true)} />
          </div>

          {/* Right Column: PROGRAM (LIVE) MONITOR */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <LiveMonitor />
          </div>
        </main>
      </div>

      {/* Bottom Transport Bar */}
      <TransportBar onOpenDisplays={() => setShowDisplaysModal(true)} />

      {/* Modals */}
      <SongEditorModal />
      <SongImporterModal />
      <AnnouncementEditor />

      <DisplaySelector
        isOpen={showDisplaysModal}
        onClose={() => setShowDisplaysModal(false)}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <EventEditorModal
        isOpen={showEventEditorModal}
        onClose={() => setShowEventEditorModal(false)}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />

      <UnsavedChangesModal />

      {/* Reproductor de audio local para cabina y ensayo en pantalla única cuando el proyector no está activo */}
      <audio
        ref={localAudioRef}
        className="hidden"
        onTimeUpdate={(e) => {
          if (presentation.presentationWindowOpen) return;
          const el = e.currentTarget;
          emitChurchMessage({
            type: 'MEDIA_STATE_UPDATE',
            channel: 'audio',
            mediaLoadId: presentation.mediaLoadId,
            currentTime: el.currentTime,
            duration: isNaN(el.duration) ? 0 : el.duration,
            isPlaying: !el.paused && !el.ended,
            volume: el.volume,
            speed: el.playbackRate,
            isMuted: el.muted || el.volume === 0,
            ended: el.ended,
            activeMediaId: presentation.backgroundAudio?.filePath || null,
          });
        }}
        onLoadedMetadata={(e) => {
          if (presentation.presentationWindowOpen) return;
          const el = e.currentTarget;
          emitChurchMessage({
            type: 'MEDIA_STATE_UPDATE',
            channel: 'audio',
            mediaLoadId: presentation.mediaLoadId,
            currentTime: el.currentTime,
            duration: isNaN(el.duration) ? 0 : el.duration,
            isPlaying: !el.paused && !el.ended,
            volume: el.volume,
            speed: el.playbackRate,
            isMuted: el.muted || el.volume === 0,
            ended: el.ended,
            activeMediaId: presentation.backgroundAudio?.filePath || null,
          });
        }}
        onEnded={() => {
          if (presentation.presentationWindowOpen) return;
          emitChurchMessage({
            type: 'MEDIA_STATE_UPDATE',
            channel: 'audio',
            mediaLoadId: presentation.mediaLoadId,
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            volume: 1,
            speed: 1,
            isMuted: false,
            ended: true,
            activeMediaId: null,
          });
        }}
      />
    </div>
  );
};