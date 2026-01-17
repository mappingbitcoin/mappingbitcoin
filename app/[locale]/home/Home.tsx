'use client'

import HeroSection from "@/app/[locale]/home/HeroSection";
import StatsSection from "@/app/[locale]/home/StatsSection";
import ContentEntryPoints from "@/app/[locale]/home/ContentEntryPoints";
import EcosystemSection from "@/app/[locale]/home/EcosystemSection";
import MapHero from "@/app/[locale]/treasure/MapHero";

const Home = () => {
    return (
        <div className="relative">
            {/* Treasure map background */}
            <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
                <MapHero
                    scrollModelPath="/assets/treasure-map/pirate-treasure-map.obj"
                    scrollTexturePath="/assets/treasure-map/pirate-treasure-map_diffuse.webp"
                />
            </div>

            {/* Content overlay */}
            <div className="relative z-10">
                <HeroSection />
                <StatsSection />
                <ContentEntryPoints />
                <EcosystemSection />
            </div>
        </div>
    );
};

export default Home;
