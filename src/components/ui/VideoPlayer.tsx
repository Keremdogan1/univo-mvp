import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Minimize, Settings, PictureInPicture, Check } from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    className?: string;
    poster?: string;
}

export default function VideoPlayer({ src, className = "", poster }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    let controlsTimeout: NodeJS.Timeout;

    const [error, setError] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };

        const updateDuration = () => {
            setDuration(video.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setShowControls(true);
        };
        
        const handleRateChange = () => {
             setPlaybackRate(video.playbackRate);
        }

        const handleError = () => {
            console.error("Video load error:", video.error);
            setError(true);
            setIsPlaying(false);
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('ratechange', handleRateChange);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('ratechange', handleRateChange);
            video.removeEventListener('error', handleError);
        };
    }, []);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        // Close settings if open
        if(showSettings) setShowSettings(false); 
        
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (videoRef.current) {
            const time = (value / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(value);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = value;
            setVolume(value);
            setIsMuted(value === 0);
        }
    };

    const toggleFullscreen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowSettings(false);
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            try {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.error("Error attempting to enable fullscreen:", err);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Auto-hide controls
    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeout);
        if (isPlaying && !showSettings) {
            controlsTimeout = setTimeout(() => setShowControls(false), 2000);
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying && !showSettings) {
            setShowControls(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // New Features
    const handleSpeedChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setShowSettings(false);
        }
    };

    const togglePiP = async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (videoRef.current && document.pictureInPictureEnabled) {
            await videoRef.current.requestPictureInPicture();
        }
        setShowSettings(false);
    };

    return (
        <div 
            ref={containerRef}
            className={`relative group bg-black overflow-hidden select-none z-0 ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                poster={poster}
                playsInline
            />

            {/* Error Message */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                    <span className="text-white text-sm font-medium mb-1">Video Oynatılamadı</span>
                    <span className="text-white/50 text-xs">Bağlantı veya yetki hatası</span>
                </div>
            )}

            {/* Play/Pause Overlay Icon (Centered) */}
            {!isPlaying && !showSettings && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                        <Play size={32} className="text-white fill-white ml-1" />
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-2 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} onClick={(e) => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="relative h-1 mb-4 group/progress cursor-pointer">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-white/30 rounded-full">
                        <div 
                            className="bg-primary h-full rounded-full relative" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button type="button" onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>

                        <span className="text-white/80 text-xs font-mono">
                            {formatTime(currentTime)} / {formatTime(duration || 0)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Settings Menu */}
                        <div className="relative">
                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-3 w-48 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden p-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            type="button"
                                            onClick={togglePiP}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors text-left"
                                        >
                                            <PictureInPicture size={16} />
                                            <span>Pencere İçinde</span>
                                        </button>
                                        
                                        <div className="h-px bg-white/10 my-1" />
                                        
                                        <div className="px-3 py-1 text-xs text-white/50 font-bold uppercase tracking-wider">Hız</div>
                                        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                type="button"
                                                onClick={() => handleSpeedChange(rate)}
                                                className="flex items-center justify-between w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                                            >
                                                <span>{rate}x</span>
                                                {playbackRate === rate && <Check size={14} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} 
                                className={`text-white hover:text-primary transition-colors ${showSettings ? 'rotate-90 text-primary' : ''}`}
                            >
                                <Settings size={20} />
                            </button>
                        </div>

                        <button type="button" onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
