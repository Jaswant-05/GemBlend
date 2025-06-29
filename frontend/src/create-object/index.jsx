import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { AlertCircle, Download } from "lucide-react";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import Navbar from "@/components/custom/Navbar";

export default function CreateObject() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [error, setError] = useState(null);
    const { getToken, isSignedIn, userId } = useAuth(); // Added userId here

    const authenticatedFetch = async (url, options = {}) => {
        const token = await getToken();
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    };

    const handleInputChange = (e) => {
        setPrompt(e.target.value);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setCurrentProject(null);
        setError(null);

        try {
            const response = await authenticatedFetch('http://localhost:3001/api/generate', {
                method: 'POST',
                body: JSON.stringify({ prompt: prompt.trim() }),
            });

            const result = await response.json();

            if (result.success && result.previewImage && result.blendFile) {
                setCurrentProject({
                    projectId: result.projectId,
                    prompt: prompt.trim(),
                    previewImage: result.previewImage,
                    blendFile: result.blendFile,
                    executionTime: result.executionTime || 0,
                });
                setPrompt(""); // Clear input
            } else {
                setError(result.error || 'Generation failed. Please try again.');
            }
        } catch (error) {
            setError('Failed to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // FIXED DOWNLOAD FUNCTION
    const handleDownload = async () => {
        if (!currentProject || !userId) {
            setError('Unable to download - missing project or user information');
            return;
        }

        try {
            // Use the proper download API endpoint
            const response = await authenticatedFetch(
                `http://localhost:3001/api/projects/${currentProject.projectId}/download/blend?userId=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${await getToken()}`,
                    },
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentProject.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.blend`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            setError('Download failed. Please try again.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && prompt.trim()) {
            handleGenerate();
        }
    };

    if (!isSignedIn) {
        return (
            <div>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-xl text-gray-500 mb-4">Please sign in to create an object.</p>
                        <SignInButton mode="modal">
                            <Button
                                variant="slate"
                                className="cursor-pointer">
                                Sign In
                            </Button>
                        </SignInButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="sm:px-10 md:px-32 lg:px-56 xl:px-10 px-5 mt-10">
                <h2 className="font-bold text-3xl mb-2 text-slate-800">Describe your Blender object</h2>
                <p className="mb-8 text-gray-500 text-xl">
                    Enter a prompt and our AI will generate a Blender-ready 3D scene for you.
                </p>

                <div className="flex flex-col gap-8 max-w-xl mx-auto">
                    <div>
                        <Label htmlFor="prompt" className="text-lg font-medium mb-2 block text-slate-800">
                            What do you want to create?
                        </Label>
                        <Input
                            id="prompt"
                            type="text"
                            placeholder="e.g. A modern kitchen with wooden cabinets"
                            value={prompt}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="slate"
                            disabled={loading || !prompt.trim()}
                            onClick={handleGenerate}
                            className="cursor-pointer transition-all duration-300 hover:-translate-y-0.5 min-w-[160px] flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
                                    Generating...
                                </>
                            ) : (
                                "Generate 3D Scene"
                            )}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {currentProject && (
                        <div className="mt-8 flex flex-col items-center">
                            {/* FIXED IMAGE SOURCE */}
                            <img
                                src={`http://localhost:3001${currentProject.previewImage}`}
                                alt="Generated Blender Object"
                                className="rounded-lg border shadow max-w-full"
                                width={400}
                                height={300}
                            />
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <p className="text-gray-700 font-medium text-center">
                                    "{currentProject.prompt}"
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Generated in {(currentProject.executionTime / 1000).toFixed(1)}s
                                </p>
                                <Button
                                    onClick={handleDownload}
                                    variant="outline"
                                    className="mt-2 flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download .blend File
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}