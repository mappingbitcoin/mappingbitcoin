import PlaceSubmissionForm from "./PlaceSubmissionForm";
import {OsmAuthProvider} from "@/providers/OsmAuth";
import {buildGeneratePageMetadata} from "@/utils/SEOUtils";

export const generateMetadata = buildGeneratePageMetadata('submit-place');

export default async function SubmitPlacePage() {
    return (
        <OsmAuthProvider>
            <PlaceSubmissionForm />
        </OsmAuthProvider>
    );
}
