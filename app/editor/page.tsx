
"use client";

import React, { useState, useEffect } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes";
import { Song, Theme, SongMetadata } from "@/src/mcs-core/model";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { InsertSectionModal } from "@/src/components/editor/InsertSectionModal";
import { EditMetadataModal } from "@/src/components/modals/EditMetadataModal";
import { ManageArrangementsModal } from "@/src/components/editor/ManageArrangementsModal";
import { parseDocument } from "yaml";

export default function EditorPage() {
    // Global Store
    const activeYaml = useAppStore((state) => state.activeYaml);
    const setActiveYaml = useAppStore((state) => state.setActiveYaml);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const resetSong = useAppStore((state) => state.resetSong);
    const router = useRouter();

    // Local State
    const [parsedSong, setParsedSong] = useState<Song | null>(null);
    const [error, setError] = useState<string | null>(null);
    const theme = useAppStore((state) => state.theme);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    const [isArrangementsModalOpen, setIsArrangementsModalOpen] = useState(false);

    // Check if component mounted client-side
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Save: Ctrl+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Save As New (Ctrl+Shift+S)
                    const newId = await import("@/src/services/storage").then(m => m.songStorage.saveSong(activeYaml));
                    useAppStore.setState({ activeSongId: newId, lastSavedYaml: activeYaml });
                    // Optional: Notify user
                    console.log("Saved as new song:", newId);
                } else {
                    // Save Existing (Ctrl+S)
                    await saveCurrentSong();
                    console.log("Saved song");
                }
            }

            // Open: Ctrl+O
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                // Navigate to library
                router.push("/");
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeYaml, saveCurrentSong, router]);

    const editorRef = React.useRef<any>(null); // Type 'any' for now to avoid specific Monaco types dependency
    const monacoRef = React.useRef<any>(null);

    const updateMarkers = (err: any) => {
        if (!monacoRef.current || !editorRef.current) return;
        const monaco = monacoRef.current;
        const model = editorRef.current.getModel();

        if (!err) {
            monaco.editor.setModelMarkers(model, "owner", []);
            return;
        }

        const markers = [];

        // Handle YAML Syntax Errors
        if (err.code === "YAML_SYNTAX_ERROR" && err.linePos) {
            const startLine = err.linePos[0].line;
            const startCol = err.linePos[0].col;
            const endLine = err.linePos[1].line;
            const endCol = err.linePos[1].col;

            markers.push({
                startLineNumber: startLine,
                startColumn: startCol,
                endLineNumber: endLine,
                endColumn: endCol,
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
            });
        }
        // Handle Zod Validation Errors (generic for now, mapped to line 1 unless we map paths)
        else if (err.code === "ZOD_VALIDATION_ERROR") {
            markers.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1000,
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
            });
        }
        // Fallback
        else {
            markers.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
                message: err.message || "Unknown error",
                severity: monaco.MarkerSeverity.Error,
            });
        }

        monaco.editor.setModelMarkers(model, "owner", markers);
    };

    const insertSnippet = (snippet: string) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();
        const text = snippet;
        const op = { range: selection, text: text, forceMoveMarkers: true };
        editor.executeEdits("my-source", [op]);
        editor.focus();
    };

    const handleSectionInsert = (snippet: string) => {
        insertSnippet(snippet);
    };

    const handleMetadataSave = (newMetadata: SongMetadata) => {
        try {
            const doc = parseDocument(activeYaml);

            if (!doc.has("metadata")) {
                doc.set("metadata", {});
            }

            // Iterate over keys and set them
            Object.keys(newMetadata).forEach(key => {
                const val = (newMetadata as any)[key];
                // Handle different types if needed, but yaml lib handles primitives well
                if (val !== undefined && val !== "") {
                    doc.setIn(["metadata", key], val);
                } else {
                    if (val === undefined) {
                        doc.deleteIn(["metadata", key]);
                    } else {
                        doc.setIn(["metadata", key], val);
                    }
                }
            });

            const newYaml = doc.toString();
            handleYamlChange(newYaml);

        } catch (e) {
            console.error("Failed to update metadata", e);
            alert("Failed to update metadata. Check console.");
        }
    };


    const handleArrangementsSave = (arrangements: any[]) => {
        try {
            // Need to import Arrangement type for strictness but any is okay for quick dev as we pass it back
            const doc = parseDocument(activeYaml);

            if (arrangements.length === 0) {
                if (doc.has("arrangements")) {
                    doc.delete("arrangements");
                }
            } else {
                doc.set("arrangements", arrangements);
            }

            const newYaml = doc.toString();
            handleYamlChange(newYaml);

        } catch (e) {
            console.error("Failed to update arrangements", e);
            alert("Failed to update arrangements. Check console.");
        }
    };

    // Initial Load from Store
    useEffect(() => {
        // Attempt to parse the starting YAML immediately
        try {
            const song = MCSParser.parse(activeYaml);
            setParsedSong(song);
        } catch (err) {
            // If initial store is invalid, that's okay, just don't crash
        }
    }, []);

    const handleYamlChange = (newYaml: string) => {
        setActiveYaml(newYaml); // Update global store

        try {
            const song = MCSParser.parse(newYaml);
            setParsedSong(song);
            setError(null); // Clear error on success

            // Clear markers
            updateMarkers(null);

        } catch (err: any) {
            setError(err.message);
            // Don't update parsedSong, keep old view

            // Set markers
            updateMarkers(err);
        }
    };



    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Pane (Left) */}
                <div className="w-1/2 flex flex-col border-r relative" style={{ borderColor: theme.colors.section_header }}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-2 p-2 border-b overflow-x-auto"
                        style={{
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.section_header
                        }}>
                        <button
                            onClick={() => setIsSectionModalOpen(true)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                        >
                            + New Section
                        </button>

                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => setIsMetadataModalOpen(true)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                        >
                            Edit Metadata
                        </button>
                        <button
                            onClick={() => setIsArrangementsModalOpen(true)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                        >
                            Arrangements
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-2 text-xs font-mono border-b border-red-200">
                            Syntax Error: {error.split('\n')[0]}
                        </div>
                    )}

                    <div className="flex-1 w-full h-full relative" style={{
                        backgroundColor: theme.name === 'Dark Mode' ? '#1e1e1e' : '#fffffe'
                    }}>
                        <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            theme={theme.name === 'Dark Mode' ? 'vs-dark' : 'light'}
                            value={activeYaml}
                            onChange={(value) => handleYamlChange(value || "")}
                            onMount={(editor, monaco) => {
                                editorRef.current = editor;
                                monacoRef.current = monaco;
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                renderWhitespace: 'selection',
                            }}
                        />
                    </div>
                </div>

                {/* Preview Pane (Right) */}
                <div className="w-1/2 overflow-y-auto relative" style={{ backgroundColor: theme.colors.background }}>
                    {parsedSong ? (
                        <div className="transform scale-90 origin-top-left p-4">
                            <SongViewer song={parsedSong} theme={theme} />
                        </div>
                    ) : (
                        <div className="p-10 text-gray-400 text-center">
                            {/* Fallback if no song is parsed yet */}
                            Start typing to see the Chart...
                        </div>
                    )}
                </div>
            </div>

            <InsertSectionModal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                onInsert={handleSectionInsert}
            />

            <EditMetadataModal
                isOpen={isMetadataModalOpen}
                onClose={() => setIsMetadataModalOpen(false)}
                initialMetadata={parsedSong?.metadata}
                onSave={handleMetadataSave}
            />

            <ManageArrangementsModal
                isOpen={isArrangementsModalOpen}
                onClose={() => setIsArrangementsModalOpen(false)}
                sections={parsedSong?.sections || []}
                existingArrangements={parsedSong?.arrangements || []}
                onSave={handleArrangementsSave}
            />        </div>
    );
}
