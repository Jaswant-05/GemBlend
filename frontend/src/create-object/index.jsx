import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Navbar from "@/components/custom/Navbar";

export default function CreateObject() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [pngUrl, setPngUrl] = useState(null);

    const handleInputChange = (e) => {
        setPrompt(e.target.value);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setPngUrl(null);

        // Simulate AI model call (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate PNG result (replace with actual PNG URL from API)
        setPngUrl("https://placehold.co/400x300/png");
        setLoading(false);
    };

    return (
        <div>
            <Navbar />
            <div className="sm:px-10 md:px-32 lg:px-56 xl:px-10 px-5 mt-10">
                <h2 className="font-bold text-3xl mb-2">Describe your Blender object</h2>
                <p className="mb-8 text-gray-500 text-xl">
                    Enter a prompt and our AI will generate a Blender-ready PNG preview for you.
                </p>

                <div className="flex flex-col gap-8 max-w-xl mx-auto">
                    <div>
                        <Label htmlFor="prompt" className="text-lg font-medium mb-2 block">
                            What do you want to create?
                        </Label>
                        <Input
                            id="prompt"
                            type="text"
                            placeholder="e.g. A low-poly tree with green leaves"
                            value={prompt}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="mt-2"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            disabled={loading || !prompt.trim()}
                            onClick={handleGenerate}
                            className="transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 min-w-[160px] flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
                                    Generating...
                                </>
                            ) : (
                                "Generate PNG"
                            )}
                        </Button>
                    </div>

                    {pngUrl && (
                        <div className="mt-8 flex flex-col items-center">
                            <img
                                src={pngUrl}
                                alt="Generated Blender Object"
                                className="rounded-lg border shadow max-w-full"
                                width={400}
                                height={300}
                            />
                            <p className="mt-2 text-gray-500 text-sm">Preview of your generated object</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}