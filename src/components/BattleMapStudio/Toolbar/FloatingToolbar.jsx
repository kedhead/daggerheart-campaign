import { useState } from 'react';
import {
    MousePointer2,
    Hand,
    Brush,
    Eraser,
    Square,
    Circle as CircleIcon,
    Minus,
    Palette,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

export default function FloatingToolbar() {
    const {
        selectedTool,
        setSelectedTool,
        drawingSettings,
        setDrawingSettings
    } = useBattleMapStore();

    const [showSettings, setShowSettings] = useState(false);

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'pan', icon: Hand, label: 'Pan' },
        { id: 'div1', type: 'divider' },
        { id: 'brush', icon: Brush, label: 'Brush' },
        { id: 'eraser', icon: Eraser, label: 'Eraser' },
        { id: 'line', icon: Minus, label: 'Line' },
        { id: 'rect', icon: Square, label: 'Rectangle' },
        { id: 'circle', icon: CircleIcon, label: 'Circle' },
    ];

    const colors = [
        '#e2e8f0', // Slate 200 (White-ish)
        '#f87171', // Red 400
        '#fbbf24', // Amber 400
        '#4ade80', // Green 400
        '#60a5fa', // Blue 400
        '#a78bfa', // Violet 400
        '#f472b6', // Pink 400
        '#000000', // Black
    ];

    const widths = [2, 4, 8, 12, 16];

    const isDrawingTool = ['brush', 'line', 'rect', 'circle', 'eraser'].includes(selectedTool);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">

            {/* Settings Popover */}
            {showSettings && isDrawingTool && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl mb-2 flex flex-col gap-3 w-64 animate-in slide-in-from-bottom-2">
                    {selectedTool !== 'eraser' && (
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Color</span>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        className={`w-6 h-6 rounded-full border border-zinc-600 transition-transform hover:scale-110 ${drawingSettings.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setDrawingSettings({ color: c })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            {selectedTool === 'eraser' ? 'Eraser Size' : 'Stroke Width'}
                        </span>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                            {widths.map(w => (
                                <button
                                    key={w}
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center hover:bg-zinc-700 transition-colors ${drawingSettings.width === w ? 'bg-zinc-600' : ''}`}
                                    onClick={() => setDrawingSettings({ width: w })}
                                >
                                    <div
                                        className="rounded-full bg-current"
                                        style={{
                                            width: Math.min(w, 20),
                                            height: Math.min(w, 20),
                                            backgroundColor: selectedTool === 'eraser' ? '#f4f4f5' : drawingSettings.color
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Toolbar */}
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full px-2 py-2 shadow-2xl flex items-center gap-2">
                {tools.map((tool) => {
                    if (tool.type === 'divider') {
                        return <div key={tool.id} className="w-px h-8 bg-zinc-700 mx-1" />;
                    }

                    const Icon = tool.icon;
                    const isActive = selectedTool === tool.id;

                    return (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setSelectedTool(tool.id);
                                if (['brush', 'line', 'rect', 'circle', 'eraser'].includes(tool.id)) {
                                    setShowSettings(true);
                                }
                            }}
                            className={`
                p-2.5 rounded-full transition-all duration-200 relative group
                ${isActive
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }
              `}
                            title={tool.label}
                        >
                            <Icon size={20} />
                            {/* Tooltip */}
                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-zinc-700">
                                {tool.label}
                            </span>
                        </button>
                    );
                })}

                {/* Settings Toggle (only if drawing) */}
                {isDrawingTool && (
                    <>
                        <div className="w-px h-8 bg-zinc-700 mx-1" />
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`
                p-2.5 rounded-full transition-all duration-200
                ${showSettings ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
              `}
                            title="Settings"
                        >
                            {showSettings ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
