import React from "react";

const VideoEmbed = ({ url }: {url:string}) => {
    let embedUrl = "";

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.split("v=")[1]?.split("&")[0] || url.split("youtu.be/")[1];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("vimeo.com")) {
        const videoId = url.split("vimeo.com/")[1];
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    if (!embedUrl) return null; // If it's not a video link, return nothing

    return (
        <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full bg-black rounded-lg">
            <iframe
                src={embedUrl}
                allowFullScreen
                frameBorder="0"
                className="absolute top-0 left-0 w-full h-full border-none"
            />
        </div>
    );
};

export default VideoEmbed;
