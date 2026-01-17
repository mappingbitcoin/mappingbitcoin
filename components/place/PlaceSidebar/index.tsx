"use client";

import { motion } from "framer-motion";
import PlaceInformation from "../PlaceInformation";
import {EnrichedVenue} from "@/models/Overpass";

type Props = { venue: EnrichedVenue };

export default function PlaceSidebar({ venue }: Props) {
    return (
        <motion.aside
            className="absolute max-w-full w-[360px] h-full p-0 top-0 bg-surface overflow-y-auto flex flex-col gap-4 shadow-[4px_0_20px_rgba(0,0,0,0.5)] border-r border-border-light z-20"
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <PlaceInformation venue={venue} isSideBar={true}/>
        </motion.aside>
    );
}
