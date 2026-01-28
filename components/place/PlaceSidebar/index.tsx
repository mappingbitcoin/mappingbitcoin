"use client";

import { motion } from "framer-motion";
import PlaceInformation from "../PlaceInformation";
import {EnrichedVenue} from "@/models/Overpass";

type Props = { venue: EnrichedVenue };

export default function PlaceSidebar({ venue }: Props) {
    return (
        <motion.aside
            className="absolute left-0 max-w-full w-[360px] h-full p-0 top-0 bg-surface overflow-y-auto flex flex-col gap-4 shadow-[4px_0_20px_rgba(0,0,0,0.5)] border-r border-border-light z-20"
            initial={{ x: -360 }}
            animate={{ x: 0 }}
            exit={{ x: -360 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        >
            <PlaceInformation venue={venue} isSideBar={true}/>
        </motion.aside>
    );
}
